import { WorkId, newId } from '@grimoire/shared';
import { ExternalIdentifier } from '../value-objects/external-identifier.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * The primary content type / format of a Work.
 *
 * Used for format-specific UX decisions: chapter vs episode navigation,
 * default reader mode, return-signal labelling, etc.
 */
export enum ContentType {
  Manga = 'manga',
  Manhwa = 'manhwa',
  Manhua = 'manhua',
  Webtoon = 'webtoon',
  LightNovel = 'light_novel',
  WebNovel = 'web_novel',
  WesternNovel = 'western_novel',
  Anime = 'anime',
  Donghua = 'donghua',
  EPUB = 'epub',
  PDF = 'pdf',
  CBZ = 'cbz',
  Audiobook = 'audiobook',
  Fanfiction = 'fanfiction',
  Movie = 'movie',
  CDrama = 'cdrama',
  KDrama = 'kdrama',
  JDrama = 'jdrama',
  Series = 'series',
}

/**
 * Cultural / geographic origin of the Work's source material.
 * Drives default reading-direction and UI chrome.
 */
export enum ContentOrigin {
  Korean = 'korean',
  Japanese = 'japanese',
  Chinese = 'chinese',
  Western = 'western',
  Original = 'original',
  Unknown = 'unknown',
}

/**
 * Ongoing publication lifecycle state as reported by the source or set manually.
 */
export enum PublicationState {
  Ongoing = 'ongoing',
  Completed = 'completed',
  Hiatus = 'hiatus',
  Cancelled = 'cancelled',
  Unknown = 'unknown',
}

/**
 * Who can see this Work within Grimoire.
 *
 * - Public  — visible in all views
 * - Private — visible only within the app, excluded from sync/export
 * - Vault   — encrypted at rest; requires vault unlock to view
 */
export enum PrivacyState {
  Public = 'public',
  Private = 'private',
  Vault = 'vault',
}

// ---------------------------------------------------------------------------
// Work entity
// ---------------------------------------------------------------------------

export type WorkCreatorRole =
  | 'author'
  | 'writer'
  | 'artist'
  | 'translator'
  | 'studio'
  | 'editor'
  | 'other';

export interface WorkCreator {
  readonly id: string;
  readonly workId: WorkId;
  readonly name: string;
  readonly role: WorkCreatorRole;
  readonly sortOrder: number;
}

export type ContentRating = 'everyone' | 'teen' | 'mature' | 'explicit';

/**
 * Core aggregate root of Grimoire.
 *
 * Represents a trackable piece of media — manga, webtoon, novel, anime, etc.
 * All fields are readonly to enforce immutability.  To update, use
 * `applyWorkPatch()` which returns a new Work.
 */
export interface Work {
  /** Unique branded identifier. */
  readonly id: WorkId;

  /** Primary display title. */
  readonly title: string;

  /**
   * Alternative titles (romanisations, translated titles, regional variants).
   * Used for search and deduplication.
   */
  readonly alternativeTitles: readonly string[];

  /**
   * Short aliases or nicknames (e.g. "OPM" for "One Punch Man").
   */
  readonly aliases: readonly string[];

  /** Long-form synopsis / description of the Work.  May be null. */
  readonly description: string | null;

  /** Content format (manga, anime, novel, …). */
  readonly contentType: ContentType;

  /** Cultural origin — drives reading direction and other defaults. */
  readonly origin: ContentOrigin;

  /** Current lifecycle state of the publication. */
  readonly publicationState: PublicationState;

  /** Visibility level within the app. */
  readonly privacyState: PrivacyState;

  /**
   * Reference to the cover image asset (file path or asset ID).
   * Null when no cover has been set.
   */
  readonly coverRef: string | null;

  /** Cross-references to external tracking services. */
  readonly externalIds: readonly ExternalIdentifier[];

  /** Genre tags from metadata (e.g. "Action", "Romance", "Sci-Fi"). */
  readonly genres: readonly string[];

  /** Freeform user or metadata tags. */
  readonly tags: readonly string[];

  /** Optional multi-creator credits (authors, writers, artists, translators, studios). */
  readonly creators?: readonly WorkCreator[];

  /** Optional personal rating / review score (0 to 10). */
  readonly rating?: number | null;

  /** Optional total chapter, volume, and page counts. */
  readonly totalChapters?: number | null;
  readonly totalVolumes?: number | null;
  readonly totalPages?: number | null;

  /** Optional publication start and end dates (ISO or YYYY-MM-DD). */
  readonly startDate?: string | null;
  readonly endDate?: string | null;

  /** Optional original-language title and language code/name. */
  readonly originalTitle?: string | null;
  readonly originalLanguage?: string | null;

  /** Optional content warnings and user-defined content rating. */
  readonly contentWarnings?: readonly string[];
  readonly contentRating?: ContentRating | null;

  /** ISO 8601 creation timestamp. */
  readonly createdAt: string;

  /** ISO 8601 timestamp of last modification. */
  readonly updatedAt: string;

  /**
   * ISO 8601 soft-deletion timestamp.
   * Null means the Work is not archived/deleted.
   */
  readonly deletedAt: string | null;

  /**
   * Target WorkId if this work was soft-archived/merged into another work.
   */
  readonly mergedIntoWorkId?: WorkId | null;
}

// ---------------------------------------------------------------------------
// WorkSummary — lighter projection for list/library views
// ---------------------------------------------------------------------------

/**
 * Lightweight projection of Work for use in Library grids and ReturnDesk lists.
 * Does not include long-form fields (description, externalIds, etc.)
 */
export interface WorkSummary {
  readonly id: WorkId;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly contentType: ContentType;
  readonly origin: ContentOrigin;
  readonly publicationState: PublicationState;
  readonly privacyState: PrivacyState;
  readonly coverRef: string | null;
  readonly genres: readonly string[];
  readonly updatedAt: string;
  readonly deletedAt: string | null;
  readonly mergedIntoWorkId?: WorkId | null;
}

// ---------------------------------------------------------------------------
// Factory / update helpers
// ---------------------------------------------------------------------------

/** Parameters required to create a new Work. */
export type CreateWorkParams = Omit<
  Work,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

/**
 * Create an immutable Work entity with a fresh ID and timestamps.
 *
 * @throws {Error} If title is blank.
 */
export function createWork(params: CreateWorkParams): Work {
  validateWorkInvariant(params);
  const now = new Date().toISOString();
  return {
    ...params,
    id: newId() as WorkId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    mergedIntoWorkId: params.mergedIntoWorkId ?? null,
  };
}

/**
 * Return a new Work with the given patch merged in and `updatedAt` refreshed.
 * Never mutates the original.
 */
export function applyWorkPatch(
  work: Work,
  patch: Partial<Omit<Work, 'id' | 'createdAt'>>,
): Work {
  const candidate = { ...work, ...patch, updatedAt: new Date().toISOString() };
  validateWorkInvariant(candidate);
  return candidate;
}

/**
 * Project a full Work into a WorkSummary (omits heavy fields).
 */
export function toWorkSummary(work: Work): WorkSummary {
  return {
    id: work.id,
    title: work.title,
    aliases: work.aliases,
    contentType: work.contentType,
    origin: work.origin,
    publicationState: work.publicationState,
    privacyState: work.privacyState,
    coverRef: work.coverRef,
    genres: work.genres,
    updatedAt: work.updatedAt,
    deletedAt: work.deletedAt,
    mergedIntoWorkId: work.mergedIntoWorkId ?? null,
  };
}

// ---------------------------------------------------------------------------
// Invariant validator
// ---------------------------------------------------------------------------

/**
 * Assert domain invariants for a Work or CreateWorkParams.
 *
 * @throws {Error} On invariant violation.
 */
export function validateWorkInvariant(
  candidate: Pick<Work, 'title'>,
): void {
  if (!candidate.title.trim()) {
    throw new Error('Work invariant violated: title must not be blank');
  }
}
