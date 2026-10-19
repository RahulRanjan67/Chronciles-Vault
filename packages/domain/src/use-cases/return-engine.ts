import { WorkId } from "@grimoire/shared";
import {
  PersonalState,
  ReadingPriority,
  ReadingRelationship,
} from "../entities/reading-relationship.js";
import { extractNumericProgress, formatProgressAnchor } from "../entities/progress.js";
import { UpdateEntry } from "../value-objects/update-entry.js";
import {
  ReturnSignal,
  ReturnSignalType,
  createReturnSignal,
  compareReturnSignals,
} from "../return/return-signals.js";

// ---------------------------------------------------------------------------
// Engine Configuration
// ---------------------------------------------------------------------------

export interface ReturnEngineConfig {
  /** Maximum days of inactivity before a work is considered "stalled". Default: 14. */
  readonly stalledThresholdDays: number;
  /** Days of recent activity considered "continue now". Default: 3. */
  readonly activeRecencyDays: number;
  /** Number of new releases to trigger a "binge ready" signal on a paused work. Default: 5. */
  readonly bingeReadyThreshold: number;
  /** Inactivity days for completed/paused works to trigger "rediscover". Default: 60. */
  readonly rediscoverThresholdDays: number;
}

export const DEFAULT_RETURN_ENGINE_CONFIG: ReturnEngineConfig = {
  stalledThresholdDays: 14,
  activeRecencyDays: 3,
  bingeReadyThreshold: 5,
  rediscoverThresholdDays: 60,
};

// ---------------------------------------------------------------------------
// Pure Function Return Engine
// ---------------------------------------------------------------------------

/**
 * Computes deterministic, ranked return signals for all works in a user's library.
 * Pure function with zero side effects.
 *
 * @param relationships Current active reading relationships.
 * @param updates Map of detected updates keyed by WorkId.
 * @param now Current date reference point.
 * @param config Optional tuning thresholds.
 * @returns Ranked list of ReturnSignals sorted by descending priority.
 */
export function computeReturnSignals(
  relationships: readonly ReadingRelationship[],
  updates: ReadonlyMap<WorkId, readonly UpdateEntry[]>,
  now: Date,
  config: ReturnEngineConfig = DEFAULT_RETURN_ENGINE_CONFIG,
): ReturnSignal[] {
  const signals: ReturnSignal[] = [];
  const nowMs = now.getTime();

  for (const rel of relationships) {
    // Archived or dropped works do not generate automatic return prompts
    if (
      rel.personalState === PersonalState.Archived ||
      rel.personalState === PersonalState.Dropped
    ) {
      continue;
    }

    const lastActivityDate = rel.lastActiveAt ?? rel.stoppedAt ?? rel.completedAt;
    const daysSinceActivity = lastActivityDate
      ? Math.max(
          0,
          Math.floor((nowMs - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)),
        )
      : undefined;

    const workUpdates = updates.get(rel.workId) ?? [];
    const latestUpdate =
      workUpdates.length > 0
        ? [...workUpdates].sort((a, b) => (b.numericIndex ?? 0) - (a.numericIndex ?? 0))[0]
        : undefined;

    const currentAnchorValue = rel.currentAnchor ? extractNumericProgress(rel.currentAnchor) : null;

    // Check for new releases / catch-up opportunities
    let newMaterialCount: number | undefined;
    if (latestUpdate && latestUpdate.numericIndex !== undefined && currentAnchorValue !== null) {
      const diff = latestUpdate.numericIndex - currentAnchorValue;
      if (diff > 0) {
        newMaterialCount = Math.max(1, Math.round(diff));
      }
    }

    // 1. Works with new releases available while active or caught up
    if (
      newMaterialCount !== undefined &&
      newMaterialCount > 0 &&
      (rel.personalState === PersonalState.Reading ||
        rel.personalState === PersonalState.Watching ||
        rel.personalState === PersonalState.CaughtUp ||
        rel.personalState === PersonalState.Waiting)
    ) {
      const priorityBonus =
        rel.priority === ReadingPriority.Urgent
          ? 15
          : rel.priority === ReadingPriority.High
            ? 8
            : 0;

      signals.push(
        createReturnSignal({
          type: ReturnSignalType.CatchUp,
          workId: rel.workId,
          explanation: `${newMaterialCount} new chapter${
            newMaterialCount > 1 ? "s" : ""
          } available since your last visit (latest: ${latestUpdate?.label})`,
          priority: Math.min(95, 65 + newMaterialCount * 3 + priorityBonus),
          newMaterialCount,
          daysSinceActivity,
          progressAnchor: rel.currentAnchor ?? undefined,
        }),
      );
      continue;
    }

    // 2. Paused works that have accumulated a binge-worthy batch
    if (
      rel.personalState === PersonalState.Paused &&
      newMaterialCount !== undefined &&
      newMaterialCount >= config.bingeReadyThreshold
    ) {
      signals.push(
        createReturnSignal({
          type: ReturnSignalType.BingeReady,
          workId: rel.workId,
          explanation: `${newMaterialCount} chapters have accumulated while paused — ready to binge!`,
          priority: Math.min(90, 70 + newMaterialCount * 2),
          newMaterialCount,
          daysSinceActivity,
          progressAnchor: rel.currentAnchor ?? undefined,
        }),
      );
      continue;
    }

    if (
      rel.personalState === PersonalState.Paused &&
      daysSinceActivity !== undefined &&
      daysSinceActivity >= config.rediscoverThresholdDays
    ) {
      signals.push(
        createReturnSignal({
          type: ReturnSignalType.Rediscover,
          workId: rel.workId,
          explanation: `Paused ${daysSinceActivity} days ago — worth revisiting when you're ready`,
          priority: 35,
          daysSinceActivity,
          progressAnchor: rel.currentAnchor ?? undefined,
        }),
      );
      continue;
    }

    // 3. Active Reading / Watching
    if (
      rel.personalState === PersonalState.Reading ||
      rel.personalState === PersonalState.Watching ||
      rel.personalState === PersonalState.Rereading
    ) {
      if (daysSinceActivity !== undefined && daysSinceActivity <= config.activeRecencyDays) {
        // High priority immediate continuation
        const priorityBonus =
          rel.priority === ReadingPriority.Urgent
            ? 15
            : rel.priority === ReadingPriority.High
              ? 8
              : 0;

        const anchorText = rel.currentAnchor
          ? ` at ${formatProgressAnchor(rel.currentAnchor)}`
          : "";

        signals.push(
          createReturnSignal({
            type: ReturnSignalType.ContinueNow,
            workId: rel.workId,
            explanation: `Pick up where you left off${anchorText}`,
            priority: Math.min(100, 85 + priorityBonus - daysSinceActivity * 3),
            daysSinceActivity,
            progressAnchor: rel.currentAnchor ?? undefined,
          }),
        );
      } else if (
        daysSinceActivity !== undefined &&
        daysSinceActivity >= config.stalledThresholdDays
      ) {
        // Inactivity stall
        const anchorText = rel.currentAnchor
          ? ` at ${formatProgressAnchor(rel.currentAnchor)}`
          : "";

        signals.push(
          createReturnSignal({
            type: ReturnSignalType.Stalled,
            workId: rel.workId,
            explanation: `No progress in ${daysSinceActivity} days — pick back up${anchorText}`,
            priority: Math.max(
              30,
              Math.min(65, 50 + (rel.priority === ReadingPriority.High ? 10 : 0)),
            ),
            daysSinceActivity,
            progressAnchor: rel.currentAnchor ?? undefined,
          }),
        );
      } else {
        // Normal ongoing reading
        signals.push(
          createReturnSignal({
            type: ReturnSignalType.ContinueNow,
            workId: rel.workId,
            explanation: `Currently reading — active ${daysSinceActivity ?? 0} days ago`,
            priority: 60,
            daysSinceActivity,
            progressAnchor: rel.currentAnchor ?? undefined,
          }),
        );
      }
      continue;
    }

    // 4. Waiting or Caught Up
    if (
      rel.personalState === PersonalState.Waiting ||
      rel.personalState === PersonalState.CaughtUp
    ) {
      signals.push(
        createReturnSignal({
          type: ReturnSignalType.Waiting,
          workId: rel.workId,
          explanation: "Caught up with latest releases — awaiting new chapter drops",
          priority: 20,
          daysSinceActivity,
          progressAnchor: rel.currentAnchor ?? undefined,
        }),
      );
      continue;
    }

    // 5. Rediscover (Completed works or older paused works)
    if (rel.personalState === PersonalState.Completed) {
      const daysSinceComplete = rel.completedAt
        ? Math.floor((nowMs - new Date(rel.completedAt).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      if (daysSinceComplete !== undefined && daysSinceComplete >= config.rediscoverThresholdDays) {
        signals.push(
          createReturnSignal({
            type: ReturnSignalType.Rediscover,
            workId: rel.workId,
            explanation: `Finished ${daysSinceComplete} days ago — worth reflecting on or revisiting`,
            priority: 35,
            daysSinceActivity: daysSinceComplete,
            progressAnchor: rel.currentAnchor ?? undefined,
          }),
        );
      }
      continue;
    }

    // 6. Planned works with elevated priority
    if (
      rel.personalState === PersonalState.Planned &&
      (rel.priority === ReadingPriority.High || rel.priority === ReadingPriority.Urgent)
    ) {
      signals.push(
        createReturnSignal({
          type: ReturnSignalType.ContinueNow,
          workId: rel.workId,
          explanation: "High priority item on your reading list — ready to start",
          priority: rel.priority === ReadingPriority.Urgent ? 65 : 50,
          daysSinceActivity,
        }),
      );
      continue;
    }
  }

  // Sort descending by priority
  return signals.sort(compareReturnSignals);
}
