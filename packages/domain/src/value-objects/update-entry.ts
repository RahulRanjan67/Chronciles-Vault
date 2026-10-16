import { WorkId } from '@chronicles-vault/shared';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * How certain we are about a detected update.
 *
 * - confirmed   — directly verified from an authoritative source (e.g. direct RSS entry)
 * - inferred    — derived from indirect signals (page count delta, metadata diff)
 * - scheduled   — expected based on a known release schedule
 * - unknown     — source present but certainty cannot be determined
 * - stale       — data was once valid but has not been refreshed in too long
 */
export enum UpdateCertainty {
  Confirmed = 'confirmed',
  Inferred = 'inferred',
  Scheduled = 'scheduled',
  Unknown = 'unknown',
  Stale = 'stale',
}

// ---------------------------------------------------------------------------
// Value object
// ---------------------------------------------------------------------------

/**
 * Represents a single detected update event for a Work — a new chapter,
 * episode, or volume release discovered via a source.
 *
 * Immutable value object: replace, never mutate.
 */
export interface UpdateEntry {
  /** ISO 8601 timestamp when this update was detected or last verified. */
  readonly detectedAt: string;

  /**
   * The work this update belongs to.
   * Populated when an update has been associated with a tracked Work.
   */
  readonly workId?: WorkId;

  /**
   * Human-readable label for the new material.
   *
   * @example 'Chapter 112' | 'Episode 24' | 'Volume 8'
   */
  readonly label: string;

  /** Confidence level for this update entry. */
  readonly certainty: UpdateCertainty;

  /**
   * Numeric chapter/episode number if applicable — enables sorting and
   * delta computation in the Return Engine.
   */
  readonly numericIndex?: number;

  /**
   * Optional direct URL to the new content on the source provider.
   */
  readonly sourceUrl?: string;

  /**
   * ISO 8601 release date announced by the source, if known.
   * May differ from detectedAt.
   */
  readonly releaseDate?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an UpdateEntry value object with required fields validated.
 */
export function createUpdateEntry(
  params: Omit<UpdateEntry, 'detectedAt'> & { detectedAt?: string },
): UpdateEntry {
  if (!params.label.trim()) throw new Error('UpdateEntry: label must not be empty');
  return {
    ...params,
    label: params.label.trim(),
    detectedAt: params.detectedAt ?? new Date().toISOString(),
  };
}
