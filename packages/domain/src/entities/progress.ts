import {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  newId,
} from '@chronicles-vault/shared';

// ---------------------------------------------------------------------------
// Progress Anchor Discriminated Union
// ---------------------------------------------------------------------------

/**
 * Progress pinpointed by chapter and optional sub-chapter decimal.
 * Common for manga, webtoons, and serialised novels.
 *
 * @example { type: 'chapter', chapter: 45, subchapter: 5 } // Chapter 45.5
 */
export interface ChapterAnchor {
  readonly type: 'chapter';
  readonly chapter: number;
  readonly subchapter?: number;
  readonly title?: string;
}

/**
 * Progress pinpointed by episode index and optional media timecode.
 * Standard for anime, donghua, or video adaptations.
 *
 * @example { type: 'episode', episode: 12, timecode: '18:42' }
 */
export interface EpisodeAnchor {
  readonly type: 'episode';
  readonly episode: number;
  readonly season?: number;
  readonly timecode?: string;
  readonly timestampSeconds?: number;
  readonly totalSeconds?: number;
  readonly title?: string;
}

/**
 * Progress pinpointed by audiobook track or chapter and optional media timecode/seconds.
 * Standard for audiobooks and audio drama adaptations.
 *
 * @example { type: 'audiobook', track: 12, timecode: '24:18', narrator: 'Travis Baldree' }
 */
export interface AudiobookAnchor {
  readonly type: 'audiobook';
  readonly track: number;
  readonly chapter?: number;
  readonly timecode?: string;
  readonly timestampSeconds?: number;
  readonly totalSeconds?: number;
  readonly narrator?: string;
  readonly title?: string;
}

/**
 * Progress pinpointed by physical or PDF page number.
 *
 * @example { type: 'page', page: 142, totalPages: 350 }
 */
export interface PageAnchor {
  readonly type: 'page';
  readonly page: number;
  readonly totalPages?: number;
}

/**
 * Progress expressed as an overall percentage (0.0 - 100.0).
 *
 * @example { type: 'percent', percent: 68.5 }
 */
export interface PercentAnchor {
  readonly type: 'percent';
  readonly percent: number;
}

/**
 * EPUB Canonical Fragment Identifier (CFI) position.
 * Exact reading locator conforming to EPUB CFI specifications.
 *
 * @example { type: 'epub_locator', cfi: 'epubcfi(/6/4[chap01]!/4/2/10/1:0)', percent: 34.2 }
 */
export interface EpubLocatorAnchor {
  readonly type: 'epub_locator';
  readonly cfi: string;
  readonly percent?: number;
  readonly chapterTitle?: string;
}

/**
 * Progress defined by both a volume number and a chapter number within that volume.
 * Common for light novels and tankobon volume manga releases.
 *
 * @example { type: 'volume_chapter', volume: 3, chapter: 14 }
 */
export interface VolumeChapterAnchor {
  readonly type: 'volume_chapter';
  readonly volume: number;
  readonly chapter: number;
  readonly title?: string;
}

/**
 * Opaque provider-specific locator or external tracking bookmark.
 * Used when capturing from third-party websites or proprietary readers.
 *
 * @example { type: 'provider', locator: 'reader/v2/segment-891', display: 'Act III: Section 2' }
 */
export interface ProviderLocatorAnchor {
  readonly type: 'provider';
  readonly locator: string;
  readonly display: string;
}

/**
 * Discriminated union of all possible progress anchoring mechanisms.
 */
export type ProgressAnchor =
  | ChapterAnchor
  | EpisodeAnchor
  | PageAnchor
  | PercentAnchor
  | EpubLocatorAnchor
  | VolumeChapterAnchor
  | ProviderLocatorAnchor
  | AudiobookAnchor;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Origin method of how reading progress was captured.
 */
export enum ProgressMethod {
  Manual = 'manual',
  Reader = 'reader',
  BrowserAssisted = 'browser_assisted',
  Provider = 'provider',
  Feed = 'feed',
  Import = 'import',
  ExternalTracker = 'external_tracker',
}

/**
 * Confidence level of the recorded progress point.
 */
export enum ProgressConfidence {
  Confirmed = 'confirmed',
  Inferred = 'inferred',
  Scheduled = 'scheduled',
  Unknown = 'unknown',
  Stale = 'stale',
}

// ---------------------------------------------------------------------------
// ProgressEvent Entity
// ---------------------------------------------------------------------------

/**
 * Immutable log of a reading progress change.
 * Forms the chronological audit trail of a user's reading activity.
 */
export interface ProgressEvent {
  readonly id: string;
  readonly workId: WorkId;
  readonly readingRelationshipId?: ReadingRelationshipId;
  readonly accessPathId?: AccessPathId;
  readonly method: ProgressMethod;
  readonly confidence: ProgressConfidence;
  readonly anchorBefore?: ProgressAnchor | null;
  readonly anchorAfter: ProgressAnchor;
  readonly provenanceNote?: string;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Formatters & UI Helpers
// ---------------------------------------------------------------------------

/**
 * Format any ProgressAnchor into a clean, human-readable display string.
 *
 * @example
 * formatProgressAnchor({ type: 'chapter', chapter: 14 }) // "Ch. 14"
 * formatProgressAnchor({ type: 'chapter', chapter: 14, subchapter: 5 }) // "Ch. 14.5"
 * formatProgressAnchor({ type: 'episode', episode: 4, timecode: '12:00' }) // "Ep. 4 (12:00)"
 * formatProgressAnchor({ type: 'page', page: 45, totalPages: 100 }) // "p. 45/100"
 * formatProgressAnchor({ type: 'percent', percent: 75.4 }) // "75%"
 */
export function formatProgressAnchor(anchor: ProgressAnchor): string {
  switch (anchor.type) {
    case 'chapter': {
      const sub = anchor.subchapter !== undefined ? `.${anchor.subchapter}` : '';
      const title = anchor.title ? ` - ${anchor.title}` : '';
      return `Ch. ${anchor.chapter}${sub}${title}`;
    }
    case 'episode': {
      const tc = anchor.timecode ? ` (${anchor.timecode})` : '';
      return `Ep. ${anchor.episode}${tc}`;
    }
    case 'page': {
      const total = anchor.totalPages !== undefined ? `/${anchor.totalPages}` : '';
      return `p. ${anchor.page}${total}`;
    }
    case 'percent': {
      return `${Math.round(anchor.percent)}%`;
    }
    case 'epub_locator': {
      if (anchor.chapterTitle) {
        return anchor.percent !== undefined
          ? `${anchor.chapterTitle} (${Math.round(anchor.percent)}%)`
          : anchor.chapterTitle;
      }
      return anchor.percent !== undefined
        ? `EPUB ${Math.round(anchor.percent)}%`
        : 'EPUB Bookmark';
    }
    case 'volume_chapter': {
      const title = anchor.title ? ` - ${anchor.title}` : '';
      return `Vol. ${anchor.volume} Ch. ${anchor.chapter}${title}`;
    }
    case 'provider': {
      return anchor.display;
    }
    case 'audiobook': {
      const tc = anchor.timecode ? ` (${anchor.timecode})` : '';
      const narr = anchor.narrator ? ` — Narrated by ${anchor.narrator}` : '';
      return `Track ${anchor.track}${tc}${narr}`;
    }
  }
}

/**
 * Alias for `formatProgressAnchor` for interface compatibility.
 */
export const displayProgress = formatProgressAnchor;

/**
 * Extract a single comparable numeric progress index if possible.
 * Useful for sorting or calculating delta differences between anchors.
 */
export function extractNumericProgress(anchor: ProgressAnchor): number | null {
  switch (anchor.type) {
    case 'chapter':
      return anchor.chapter + (anchor.subchapter ? anchor.subchapter * 0.1 : 0);
    case 'episode':
      return anchor.episode;
    case 'page':
      return anchor.page;
    case 'percent':
      return anchor.percent;
    case 'volume_chapter':
      return anchor.volume * 1000 + anchor.chapter;
    case 'epub_locator':
      return anchor.percent ?? null;
    case 'provider':
      return null;
    case 'audiobook':
      return anchor.track;
  }
}

/**
 * Normalizes any canonical or legacy progress anchor payload (`type` vs `kind`,
 * `chapter` vs `chapterNumber`, `episode` vs `episodeNumber`, `page` vs `pageNumber`,
 * `percent` vs `percentage`, `epub_locator` vs `epub_cfi`) into the canonical
 * `ProgressAnchor` discriminated union.
 */
export function normalizeProgressAnchor(raw: unknown): ProgressAnchor | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const discriminant = (typeof obj['type'] === 'string' ? obj['type'] : typeof obj['kind'] === 'string' ? obj['kind'] : undefined);

  if (discriminant === 'chapter') {
    const chapter = Number(obj['chapter'] ?? obj['chapterNumber'] ?? 0);
    const subchapterRaw = obj['subchapter'] ?? obj['subChapter'];
    const subchapter = typeof subchapterRaw === 'number' && Number.isFinite(subchapterRaw) ? subchapterRaw : undefined;
    const title = typeof obj['title'] === 'string' ? obj['title'] : undefined;
    return {
      type: 'chapter',
      chapter: Number.isFinite(chapter) && chapter >= 0 ? chapter : 0,
      ...(subchapter !== undefined ? { subchapter } : {}),
      ...(title ? { title } : {}),
    };
  }

  if (discriminant === 'episode') {
    const episode = Number(obj['episode'] ?? obj['episodeNumber'] ?? 0);
    const seasonRaw = obj['season'] ?? obj['seasonNumber'];
    const season = typeof seasonRaw === 'number' && Number.isFinite(seasonRaw) ? seasonRaw : undefined;
    const timecode = typeof obj['timecode'] === 'string' ? obj['timecode'] : undefined;
    const title = typeof obj['title'] === 'string' ? obj['title'] : undefined;
    return {
      type: 'episode',
      episode: Number.isFinite(episode) && episode >= 0 ? episode : 0,
      ...(season !== undefined ? { season } : {}),
      ...(timecode ? { timecode } : {}),
      ...(title ? { title } : {}),
    };
  }

  if (discriminant === 'audiobook' || discriminant === 'audio') {
    const track = Number(obj['track'] ?? obj['chapter'] ?? obj['trackNumber'] ?? 1);
    const timecode = typeof obj['timecode'] === 'string' ? obj['timecode'] : undefined;
    const timestampSeconds = typeof obj['timestampSeconds'] === 'number' && Number.isFinite(obj['timestampSeconds']) ? obj['timestampSeconds'] : undefined;
    const totalSeconds = typeof obj['totalSeconds'] === 'number' && Number.isFinite(obj['totalSeconds']) ? obj['totalSeconds'] : undefined;
    const narrator = typeof obj['narrator'] === 'string' ? obj['narrator'] : undefined;
    const title = typeof obj['title'] === 'string' ? obj['title'] : undefined;
    return {
      type: 'audiobook',
      track: Number.isFinite(track) && track >= 0 ? track : 1,
      ...(timecode ? { timecode } : {}),
      ...(timestampSeconds !== undefined ? { timestampSeconds } : {}),
      ...(totalSeconds !== undefined ? { totalSeconds } : {}),
      ...(narrator ? { narrator } : {}),
      ...(title ? { title } : {}),
    };
  }

  if (discriminant === 'page' || discriminant === 'cbz_page' || discriminant === 'pdf_page') {
    const page = Number(obj['page'] ?? obj['pageNumber'] ?? 0);
    const totalPagesRaw = obj['totalPages'];
    const totalPages = typeof totalPagesRaw === 'number' && Number.isFinite(totalPagesRaw) ? totalPagesRaw : undefined;
    return {
      type: 'page',
      page: Number.isFinite(page) && page >= 0 ? page : 0,
      ...(totalPages !== undefined ? { totalPages } : {}),
    };
  }

  if (discriminant === 'percent' || discriminant === 'percentage') {
    const pct = Number(obj['percent'] ?? obj['percentage'] ?? 0);
    return {
      type: 'percent',
      percent: Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0,
    };
  }

  if (discriminant === 'epub_locator' || discriminant === 'epub_cfi') {
    const cfi = typeof obj['cfi'] === 'string' && obj['cfi'].trim() ? obj['cfi'] : 'epubcfi(/6/2!)';
    const pctRaw = obj['percent'] ?? obj['percentage'];
    const percent = typeof pctRaw === 'number' && Number.isFinite(pctRaw) ? pctRaw : undefined;
    const chapterTitle = typeof obj['chapterTitle'] === 'string' ? obj['chapterTitle'] : undefined;
    return {
      type: 'epub_locator',
      cfi,
      ...(percent !== undefined ? { percent } : {}),
      ...(chapterTitle ? { chapterTitle } : {}),
    };
  }

  if (discriminant === 'volume_chapter') {
    const volume = Number(obj['volume'] ?? 1);
    const chapter = Number(obj['chapter'] ?? obj['chapterNumber'] ?? 1);
    const title = typeof obj['title'] === 'string' ? obj['title'] : undefined;
    return {
      type: 'volume_chapter',
      volume: Number.isFinite(volume) && volume >= 0 ? volume : 1,
      chapter: Number.isFinite(chapter) && chapter >= 0 ? chapter : 1,
      ...(title ? { title } : {}),
    };
  }

  if (discriminant === 'provider') {
    const locator = typeof obj['locator'] === 'string' && obj['locator'].trim() ? obj['locator'] : 'external';
    const display =
      typeof obj['display'] === 'string' && obj['display'].trim()
        ? obj['display']
        : typeof obj['label'] === 'string' && obj['label'].trim()
          ? obj['label']
          : locator;
    return {
      type: 'provider',
      locator,
      display,
    };
  }

  // Fallback for loose objects with chapter/episode/page/percent fields
  if (typeof obj['chapter'] === 'number' || typeof obj['chapterNumber'] === 'number') {
    return {
      type: 'chapter',
      chapter: Number(obj['chapter'] ?? obj['chapterNumber'] ?? 0),
    };
  }
  if (typeof obj['episode'] === 'number' || typeof obj['episodeNumber'] === 'number') {
    return {
      type: 'episode',
      episode: Number(obj['episode'] ?? obj['episodeNumber'] ?? 0),
    };
  }
  if (typeof obj['page'] === 'number' || typeof obj['pageNumber'] === 'number') {
    return {
      type: 'page',
      page: Number(obj['page'] ?? obj['pageNumber'] ?? 0),
    };
  }
  if (typeof obj['percent'] === 'number' || typeof obj['percentage'] === 'number') {
    return {
      type: 'percent',
      percent: Number(obj['percent'] ?? obj['percentage'] ?? 0),
    };
  }

  return null;
}

/**
 * Invariant validation for a ProgressAnchor.
 *
 * @throws {Error} If numbers are negative or out of expected bounds.
 */
export function validateProgressAnchor(anchor: ProgressAnchor): void {
  switch (anchor.type) {
    case 'chapter':
      if (anchor.chapter < 0 || !Number.isFinite(anchor.chapter)) {
        throw new Error(`ProgressAnchor chapter must be a non-negative finite number, got ${anchor.chapter}`);
      }
      if (anchor.subchapter !== undefined && (anchor.subchapter < 0 || !Number.isFinite(anchor.subchapter))) {
        throw new Error(`ProgressAnchor subchapter must be non-negative, got ${anchor.subchapter}`);
      }
      break;
    case 'episode':
      if (anchor.episode < 0 || !Number.isFinite(anchor.episode)) {
        throw new Error(`ProgressAnchor episode must be a non-negative finite number, got ${anchor.episode}`);
      }
      break;
    case 'page':
      if (anchor.page < 0 || !Number.isFinite(anchor.page)) {
        throw new Error(`ProgressAnchor page must be non-negative, got ${anchor.page}`);
      }
      if (anchor.totalPages !== undefined && anchor.totalPages < anchor.page) {
        throw new Error(
          `ProgressAnchor page (${anchor.page}) cannot exceed totalPages (${anchor.totalPages})`,
        );
      }
      break;
    case 'percent':
      if (anchor.percent < 0 || anchor.percent > 100 || !Number.isFinite(anchor.percent)) {
        throw new Error(`ProgressAnchor percent must be between 0 and 100, got ${anchor.percent}`);
      }
      break;
    case 'epub_locator':
      if (!anchor.cfi || !anchor.cfi.trim()) {
        throw new Error('ProgressAnchor epub_locator requires a non-empty cfi');
      }
      if (anchor.percent !== undefined && (anchor.percent < 0 || anchor.percent > 100)) {
        throw new Error(`ProgressAnchor epub_locator percent must be 0-100, got ${anchor.percent}`);
      }
      break;
    case 'volume_chapter':
      if (anchor.volume < 0 || anchor.chapter < 0) {
        throw new Error(
          `ProgressAnchor volume_chapter volume and chapter must be non-negative, got Vol ${anchor.volume}, Ch ${anchor.chapter}`,
        );
      }
      break;
    case 'provider':
      if (!anchor.locator || !anchor.locator.trim()) {
        throw new Error('ProgressAnchor provider requires a non-empty locator');
      }
      if (!anchor.display || !anchor.display.trim()) {
        throw new Error('ProgressAnchor provider requires a non-empty display string');
      }
      break;
    case 'audiobook':
      if (anchor.track < 0 || !Number.isFinite(anchor.track)) {
        throw new Error(`ProgressAnchor audiobook track must be a non-negative finite number, got ${anchor.track}`);
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateProgressEventParams = Omit<ProgressEvent, 'id' | 'createdAt'> & {
  readonly id?: string;
  readonly createdAt?: string;
};

/**
 * Create a validated, immutable ProgressEvent.
 */
export function createProgressEvent(params: CreateProgressEventParams): ProgressEvent {
  validateProgressAnchor(params.anchorAfter);
  if (params.anchorBefore) {
    validateProgressAnchor(params.anchorBefore);
  }

  return {
    ...params,
    id: params.id ?? newId(),
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}
