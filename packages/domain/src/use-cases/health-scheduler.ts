import { AccessPath, SourceHealth } from "../entities/access-path.js";
import {
  HealthMonitorState,
  createHealthMonitorState,
  recordHealthCheckFailure,
  recordHealthCheckSuccess,
  ConditionalValidators,
  ConditionalValidatorResponse,
  createConditionalRequestHeaders,
  carryForwardConditionalValidators,
} from "./source-health-policy.js";
import type { AccessPathId } from "@grimoire/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProbeResult {
  readonly ok: boolean;
  readonly status?: number;
  readonly etag?: string | null;
  readonly lastModified?: string | null;
  readonly errorMessage?: string;
  readonly latencyMs?: number;
}

export type HealthProbeFn = (
  path: AccessPath,
  signal: AbortSignal,
  headers?: Readonly<Record<string, string>>,
) => Promise<ProbeResult>;

export interface ScheduledCheckOptions {
  readonly now?: string;
  readonly random?: () => number;
  readonly force?: boolean;
}

export interface HealthCheckOutcome {
  readonly path: AccessPath;
  readonly previousState: HealthMonitorState;
  readonly newState: HealthMonitorState;
  readonly probeResult: ProbeResult;
  readonly checkedAt: string;
}

// ---------------------------------------------------------------------------
// Pure Function Evaluation
// ---------------------------------------------------------------------------

/**
 * Pure evaluation function that transitions an AccessPath and its HealthMonitorState
 * based on a ProbeResult, returning the updated AccessPath.
 */
export function applyHealthCheckResult(
  path: AccessPath,
  probe: ProbeResult,
  checkedAt: string = new Date().toISOString(),
  random: () => number = Math.random,
): { readonly updatedPath: AccessPath; readonly monitorState: HealthMonitorState } {
  const currentState: HealthMonitorState =
    path.healthMonitorState ?? createHealthMonitorState(path.health);

  let newState: HealthMonitorState;
  if (probe.ok) {
    newState = recordHealthCheckSuccess(currentState, checkedAt);
  } else {
    newState = recordHealthCheckFailure(currentState, checkedAt, random);
  }

  const updatedPath = {
    ...path,
    health: newState.health,
    healthState: newState.health,
    lastCheckedAt: checkedAt,
    healthMonitorState: newState,
    updatedAt: checkedAt,
  } as AccessPath;

  return { updatedPath, monitorState: newState };
}

/**
 * Determines whether an AccessPath is currently eligible for an automated health check.
 */
export function isEligibleForHealthCheck(
  path: AccessPath,
  now: string = new Date().toISOString(),
): boolean {
  // Local files and manual references do not undergo automated network polling
  if (path.kind === "local_file" || path.kind === "manual") {
    return false;
  }

  const state = path.healthMonitorState ?? createHealthMonitorState(path.health);

  // If auto-polling is suspended (e.g. Broken after consecutive failures), skip automated checks
  if (state.autoPollingSuspended) {
    return false;
  }

  // If nextCheckAt is in the future, respect backoff
  if (state.nextCheckAt !== null) {
    const nextCheckTime = Date.parse(state.nextCheckAt);
    const currentTime = Date.parse(now);
    if (Number.isFinite(nextCheckTime) && currentTime < nextCheckTime) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Stateful Cancellable Health Check Scheduler
// ---------------------------------------------------------------------------

export interface HealthSchedulerOptions {
  /** Default probe implementation */
  readonly probe: HealthProbeFn;
  /** Callback fired whenever an AccessPath health state changes */
  readonly onHealthChange?: (outcome: HealthCheckOutcome) => void;
  /** Check interval in milliseconds for periodic polling (default: 60,000ms / 1 min) */
  readonly intervalMs?: number;
  /** Random generator for jitter calculations (default: Math.random) */
  readonly random?: () => number;
}

export class HealthScheduler {
  private readonly probe: HealthProbeFn;
  private readonly onHealthChange?: (outcome: HealthCheckOutcome) => void;
  private readonly intervalMs: number;
  private readonly random: () => number;

  private registeredPaths = new Map<AccessPathId, AccessPath>();
  private validators = new Map<AccessPathId, ConditionalValidators>();
  private activeAbortControllers = new Map<AccessPathId, AbortController>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(options: HealthSchedulerOptions) {
    this.probe = options.probe;
    this.onHealthChange = options.onHealthChange;
    this.intervalMs = options.intervalMs ?? 60_000;
    this.random = options.random ?? Math.random;
  }

  /**
   * Register an AccessPath with the scheduler.
   */
  public register(path: AccessPath, initialValidators?: ConditionalValidators): void {
    this.registeredPaths.set(path.id, path);
    if (initialValidators) {
      this.validators.set(path.id, initialValidators);
    }
  }

  /**
   * Unregister an AccessPath from the scheduler and cancel any ongoing check.
   */
  public unregister(pathId: AccessPathId): void {
    this.cancel(pathId);
    this.registeredPaths.delete(pathId);
    this.validators.delete(pathId);
  }

  /**
   * Cancel an in-flight check for a specific AccessPath.
   */
  public cancel(pathId: AccessPathId): void {
    const controller = this.activeAbortControllers.get(pathId);
    if (controller) {
      controller.abort();
      this.activeAbortControllers.delete(pathId);
    }
  }

  /**
   * Cancel all in-flight checks.
   */
  public cancelAll(): void {
    for (const [pathId, controller] of this.activeAbortControllers.entries()) {
      controller.abort();
    }
    this.activeAbortControllers.clear();
  }

  /**
   * Start the periodic background scheduler.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);
  }

  /**
   * Stop the scheduler and cancel all in-flight checks.
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.cancelAll();
  }

  /**
   * Execute an on-demand check for a specific AccessPath, cancelling any existing check.
   */
  public async checkNow(
    pathId: AccessPathId,
    options: ScheduledCheckOptions = {},
  ): Promise<HealthCheckOutcome | null> {
    const path = this.registeredPaths.get(pathId);
    if (!path) return null;

    return this.executeCheck(path, options);
  }

  /**
   * Internal scheduler tick: finds all eligible paths and checks them.
   */
  public async tick(now: string = new Date().toISOString()): Promise<HealthCheckOutcome[]> {
    const outcomes: HealthCheckOutcome[] = [];
    const eligiblePaths: AccessPath[] = [];

    for (const path of this.registeredPaths.values()) {
      if (isEligibleForHealthCheck(path, now) && !this.activeAbortControllers.has(path.id)) {
        eligiblePaths.push(path);
      }
    }

    const checkPromises = eligiblePaths.map(async (path) => {
      try {
        const outcome = await this.executeCheck(path, { now });
        if (outcome) outcomes.push(outcome);
      } catch {
        // Individual check errors handled in executeCheck
      }
    });

    await Promise.all(checkPromises);
    return outcomes;
  }

  /**
   * Execute a single check with cancellation and conditional validator headers.
   */
  private async executeCheck(
    path: AccessPath,
    options: ScheduledCheckOptions,
  ): Promise<HealthCheckOutcome> {
    const checkedAt = options.now ?? new Date().toISOString();
    const previousState =
      path.healthMonitorState ?? createHealthMonitorState(path.health);

    // Cancel existing controller if any
    this.cancel(path.id);

    const controller = new AbortController();
    this.activeAbortControllers.set(path.id, controller);

    // Build conditional request headers
    const currentValidators = this.validators.get(path.id) ?? { etag: null, lastModified: null };
    const headers = createConditionalRequestHeaders(currentValidators);

    let probeResult: ProbeResult;
    try {
      probeResult = await this.probe(path, controller.signal, headers);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        probeResult = {
          ok: false,
          errorMessage: "Health check aborted",
        };
      } else {
        probeResult = {
          ok: false,
          errorMessage: err instanceof Error ? err.message : String(err),
        };
      }
    } finally {
      this.activeAbortControllers.delete(path.id);
    }

    // Carry forward validators if 304 or new headers
    if (probeResult.status) {
      const responseVal: ConditionalValidatorResponse = {
        status: probeResult.status,
        etag: probeResult.etag,
        lastModified: probeResult.lastModified,
      };
      const updatedValidators = carryForwardConditionalValidators(currentValidators, responseVal);
      this.validators.set(path.id, updatedValidators);
    }

    const { updatedPath, monitorState } = applyHealthCheckResult(
      path,
      probeResult,
      checkedAt,
      options.random ?? this.random,
    );

    // Update internal registered map with latest state
    this.registeredPaths.set(path.id, updatedPath);

    const outcome: HealthCheckOutcome = {
      path: updatedPath,
      previousState,
      newState: monitorState,
      probeResult,
      checkedAt,
    };

    this.onHealthChange?.(outcome);
    return outcome;
  }

  public getRegisteredPath(pathId: AccessPathId): AccessPath | undefined {
    return this.registeredPaths.get(pathId);
  }

  public getRegisteredCount(): number {
    return this.registeredPaths.size;
  }

  public getActiveCheckCount(): number {
    return this.activeAbortControllers.size;
  }

  public getValidators(pathId: AccessPathId): ConditionalValidators | undefined {
    return this.validators.get(pathId);
  }
}
