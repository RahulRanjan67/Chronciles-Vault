import { SourceHealth } from "../entities/access-path.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const JITTER_RATIO = 0.2;
const SUSPEND_AFTER_FAILURES = 5;

export interface HealthMonitorState {
  readonly health: SourceHealth;
  readonly consecutiveFailures: number;
  readonly lastCheckedAt: string | null;
  readonly lastSuccessfulAt: string | null;
  readonly nextCheckAt: string | null;
  readonly autoPollingSuspended: boolean;
}

export interface ConditionalValidators {
  readonly etag: string | null;
  readonly lastModified: string | null;
}

export interface ConditionalValidatorResponse {
  readonly status: number;
  readonly etag?: string | null;
  readonly lastModified?: string | null;
}

function parseTimestamp(value: string, label: string): number {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!match) throw new Error(`${label} must be a valid ISO 8601 timestamp`);

  const [, year, month, day, hour, minute, second, zone] = match;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  const secondNumber = Number(second);
  const calendarDate = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  const validDate =
    calendarDate.getUTCFullYear() === yearNumber &&
    calendarDate.getUTCMonth() === monthNumber - 1 &&
    calendarDate.getUTCDate() === dayNumber;
  const zoneMatch = /^([+-])(\d{2}):(\d{2})$/.exec(zone);
  const validZone =
    zone === "Z" ||
    (zoneMatch !== null && Number(zoneMatch[2]) <= 23 && Number(zoneMatch[3]) <= 59);
  const timestamp = Date.parse(value);
  if (
    !validDate ||
    hourNumber > 23 ||
    minuteNumber > 59 ||
    secondNumber > 59 ||
    !validZone ||
    !Number.isFinite(timestamp)
  ) {
    throw new Error(`${label} must be a valid ISO 8601 timestamp`);
  }
  return timestamp;
}

function validateState(state: HealthMonitorState): void {
  if (!Number.isInteger(state.consecutiveFailures) || state.consecutiveFailures < 0) {
    throw new Error("HealthMonitorState consecutiveFailures must be a non-negative integer");
  }
  if (state.lastCheckedAt !== null) parseTimestamp(state.lastCheckedAt, "lastCheckedAt");
  if (state.lastSuccessfulAt !== null) {
    parseTimestamp(state.lastSuccessfulAt, "lastSuccessfulAt");
  }
}

function ensureMonotonicCheck(state: HealthMonitorState, checkedAt: string): void {
  const timestamp = parseTimestamp(checkedAt, "checkedAt");
  if (
    state.lastCheckedAt !== null &&
    timestamp < parseTimestamp(state.lastCheckedAt, "lastCheckedAt")
  ) {
    throw new Error("checkedAt must not precede lastCheckedAt");
  }
}

export function createHealthMonitorState(
  health: SourceHealth = SourceHealth.Unknown,
): HealthMonitorState {
  return {
    health,
    consecutiveFailures: 0,
    lastCheckedAt: null,
    lastSuccessfulAt: null,
    nextCheckAt: null,
    autoPollingSuspended: false,
  };
}

/**
 * Applies one failed check and returns its backoff state. This policy performs
 * no I/O; callers decide which sources are eligible for checks.
 */
export function recordHealthCheckFailure(
  state: HealthMonitorState,
  failedAt: string,
  random: () => number = Math.random,
): HealthMonitorState {
  validateState(state);
  ensureMonotonicCheck(state, failedAt);
  const consecutiveFailures = state.consecutiveFailures + 1;

  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample > 1) {
    throw new Error("random must return a number between 0 and 1");
  }

  if (consecutiveFailures >= SUSPEND_AFTER_FAILURES) {
    return {
      ...state,
      health: SourceHealth.Broken,
      consecutiveFailures,
      lastCheckedAt: failedAt,
      nextCheckAt: null,
      autoPollingSuspended: true,
    };
  }

  const baseDelay =
    consecutiveFailures === 1 ? 15 * MINUTE : consecutiveFailures === 2 ? HOUR : 6 * HOUR;
  const retryAfterMs = Math.round(baseDelay * (1 - JITTER_RATIO + sample * 2 * JITTER_RATIO));
  const health = consecutiveFailures >= 3 ? SourceHealth.Degraded : state.health;

  return {
    ...state,
    health,
    consecutiveFailures,
    lastCheckedAt: failedAt,
    nextCheckAt: new Date(Date.parse(failedAt) + retryAfterMs).toISOString(),
    autoPollingSuspended: false,
  };
}

/** A successful check clears backoff and re-enables polling. */
export function recordHealthCheckSuccess(
  state: HealthMonitorState,
  checkedAt: string,
): HealthMonitorState {
  validateState(state);
  ensureMonotonicCheck(state, checkedAt);
  return {
    health: state.health === SourceHealth.Local ? SourceHealth.Local : SourceHealth.Healthy,
    consecutiveFailures: 0,
    lastCheckedAt: checkedAt,
    lastSuccessfulAt: checkedAt,
    nextCheckAt: null,
    autoPollingSuspended: false,
  };
}

/** Build only the conditional request headers supported by stored validators. */
export function createConditionalRequestHeaders(
  validators: ConditionalValidators,
): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (validators.etag?.trim()) headers["If-None-Match"] = validators.etag;
  if (validators.lastModified?.trim()) headers["If-Modified-Since"] = validators.lastModified;
  return headers;
}

/**
 * A 304 carries forward omitted validators. A fresh representation replaces
 * the old validator set so stale validators are not reused accidentally.
 */
export function carryForwardConditionalValidators(
  previous: ConditionalValidators,
  response: ConditionalValidatorResponse,
): ConditionalValidators {
  const etag =
    response.status === 304
      ? response.etag === undefined
        ? previous.etag
        : response.etag
      : (response.etag ?? null);
  const lastModified =
    response.status === 304
      ? response.lastModified === undefined
        ? previous.lastModified
        : response.lastModified
      : (response.lastModified ?? null);
  return { etag, lastModified };
}
