import {
  MemoryId,
  MemoryAssetId,
  WorkId,
  AccessPathId,
  newId,
} from '@chronicles-vault/shared';
import { PrivacyState } from './work.js';
import { ProgressAnchor, validateProgressAnchor } from './progress.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Kind of memory / reflection / note captured by the user.
 */
export enum MemoryType {
  Diary = 'diary',
  Screenshot = 'screenshot',
  Panel = 'panel',
  Quote = 'quote',
  FavoriteChapter = 'favorite_chapter',
  FavoritePanel = 'favorite_panel',
  Highlight = 'highlight',
  ReadingSessionNote = 'reading_session_note',
  WhySaved = 'why_saved',
  WhyStopped = 'why_stopped',
  PersonalNote = 'personal_note',
  LoreEntry = 'lore_entry',
  Note = 'note',
  Review = 'review',
  Reaction = 'reaction',
}

/**
 * Privacy visibility level for a memory.
 * @deprecated Use `PrivacyState` (`Public | Private | Vault`) instead.
 */
export enum MemoryPrivacyState {
  Public = 'public',
  Normal = 'normal',
  Private = 'private',
  Vault = 'vault',
}

/**
 * Normalizes any `PrivacyState` or legacy `MemoryPrivacyState` (`'normal'` -> `'public'`)
 * into the canonical `PrivacyState` enum.
 */
export function normalizePrivacyState(
  state: PrivacyState | MemoryPrivacyState | string | null | undefined,
): PrivacyState {
  if (state === PrivacyState.Vault || state === 'vault') return PrivacyState.Vault;
  if (state === PrivacyState.Private || state === 'private') return PrivacyState.Private;
  return PrivacyState.Public;
}

/**
 * Degree to which this memory reveals key plot developments.
 */
export enum SpoilerLevel {
  SpoilerFree = 'spoiler_free',
  Mild = 'mild',
  Minor = 'minor',
  Major = 'major',
}

export enum MemoryAssetType {
  Image = 'image',
  Video = 'video',
  File = 'file',
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/**
 * Binary asset associated with a memory (e.g. cropped panel screenshot, page capture).
 */
export interface MemoryAsset {
  readonly id: MemoryAssetId;
  readonly memoryId: MemoryId;
  readonly assetType: MemoryAssetType | 'image' | 'video' | 'file';
  readonly fileId: string;
  readonly thumbnailRef: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly createdAt: string;
}

/**
 * A personal memory, reflection, quote, highlight, or image saved by the user.
 * Can be linked to a specific Work and ProgressAnchor or stand alone.
 */
export interface Memory {
  readonly id: MemoryId;
  readonly workId: WorkId | null;
  readonly type: MemoryType;
  readonly title: string | null;
  readonly body: string | null;
  readonly privacyState: PrivacyState | MemoryPrivacyState;
  readonly spoilerLevel: SpoilerLevel;
  readonly showInGlobalGallery: boolean;
  readonly accessPathId: AccessPathId | null;
  readonly progressAnchor: ProgressAnchor | null;
  readonly readingAttemptId?: string | null;
  readonly assets: readonly MemoryAsset[];
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

/**
 * Assert domain rules for a Memory.
 *
 * @throws {Error} If a memory has neither content nor assets.
 */
export function validateMemoryInvariant(candidate: Pick<Memory, 'body' | 'title' | 'assets' | 'progressAnchor'>): void {
  const hasContent = (candidate.body && candidate.body.trim().length > 0) ||
                     (candidate.title && candidate.title.trim().length > 0) ||
                     (candidate.assets && candidate.assets.length > 0);

  if (!hasContent) {
    throw new Error('Memory invariant violated: memory must have a title, body, or at least one asset');
  }

  if (candidate.progressAnchor) {
    validateProgressAnchor(candidate.progressAnchor);
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateMemoryParams = Omit<
  Memory,
  'id' | 'createdAt' | 'updatedAt' | 'assets' | 'tags'
> & {
  readonly id?: MemoryId;
  readonly assets?: readonly MemoryAsset[];
  readonly tags?: readonly string[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export function createMemory(params: CreateMemoryParams): Memory {
  const memoryObj: Pick<Memory, 'body' | 'title' | 'assets' | 'progressAnchor'> = {
    title: params.title,
    body: params.body,
    assets: params.assets ?? [],
    progressAnchor: params.progressAnchor,
  };
  validateMemoryInvariant(memoryObj);
  const now = new Date().toISOString();
  return {
    ...params,
    assets: params.assets ?? [],
    tags: params.tags ?? [],
    id: params.id ?? (newId() as MemoryId),
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  };
}

export function applyMemoryPatch(
  memory: Memory,
  patch: Partial<Omit<Memory, 'id' | 'createdAt'>>,
): Memory {
  const updated: Memory = {
    ...memory,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  validateMemoryInvariant(updated);
  return updated;
}

export type CreateMemoryAssetParams = Omit<MemoryAsset, 'id' | 'createdAt'> & {
  readonly id?: MemoryAssetId;
  readonly createdAt?: string;
};

export function createMemoryAsset(params: CreateMemoryAssetParams): MemoryAsset {
  if (!params.fileId || !params.fileId.trim()) {
    throw new Error('MemoryAsset invariant violated: fileId must not be empty');
  }
  return {
    ...params,
    id: params.id ?? (newId() as MemoryAssetId),
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}
