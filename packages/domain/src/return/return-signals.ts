import { WorkId } from '@grimoire/shared';
import { ProgressAnchor } from '../entities/progress.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Categorical type of return signal calculated for a Work.
 */
export enum ReturnSignalType {
  /** Active work recently engaged with, ready to be immediately resumed. */
  ContinueNow = 'continue_now',

  /** Work with new chapters or episodes available since the user's last session. */
  CatchUp = 'catch_up',

  /** Work started but abandoned or inactive for an extended duration. */
  Stalled = 'stalled',

  /** User is completely caught up with the source and waiting for new releases. */
  Waiting = 'waiting',

  /** A previously paused work that has accumulated a substantial backlog to binge. */
  BingeReady = 'binge_ready',

  /** A completed or forgotten favorite worth re-reading or reflecting upon. */
  Rediscover = 'rediscover',
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * Actionable intelligence signal suggesting what to read next.
 * Purely derived and explainable.
 */
export interface ReturnSignal {
  readonly type: ReturnSignalType;
  readonly workId: WorkId;
  readonly explanation: string;
  readonly priority: number; // 0 to 100
  readonly newMaterialCount?: number;
  readonly daysSinceActivity?: number;
  readonly progressAnchor?: ProgressAnchor;
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export function createReturnSignal(params: ReturnSignal): ReturnSignal {
  const clampedPriority = Math.max(0, Math.min(100, Math.round(params.priority)));
  return {
    ...params,
    priority: clampedPriority,
  };
}

/**
 * Compare two ReturnSignals by descending priority (higher priority first).
 */
export function compareReturnSignals(a: ReturnSignal, b: ReturnSignal): number {
  return b.priority - a.priority;
}
