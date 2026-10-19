import {
  PublicationId,
  PublicationItemId,
  UserListId,
  WorkId,
  newId,
} from '@grimoire/shared';
import { PrivacyState } from './work.js';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/**
 * An item featured within an editorial publication or curated export list.
 */
export interface PublicationItem {
  readonly id: PublicationItemId;
  readonly publicationId: PublicationId;
  readonly workId: WorkId;
  readonly position: number;
  readonly commentary: string | null;
}

/**
 * An editorial collection, reading guide, or curated article prepared for sharing or export.
 */
export interface Publication {
  readonly id: PublicationId;
  readonly title: string;
  readonly description: string | null;
  readonly listId: UserListId | null;
  readonly items: readonly PublicationItem[];
  readonly publishedAt: string | null;
  readonly privacyState: PrivacyState;
  readonly slug: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

export function validatePublicationInvariant(candidate: Pick<Publication, 'title'>): void {
  if (!candidate.title || !candidate.title.trim()) {
    throw new Error('Publication invariant violated: title must not be empty');
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreatePublicationParams = Omit<
  Publication,
  'id' | 'items' | 'createdAt' | 'updatedAt'
> & {
  readonly id?: PublicationId;
  readonly items?: readonly PublicationItem[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export function createPublication(params: CreatePublicationParams): Publication {
  validatePublicationInvariant(params);
  const now = new Date().toISOString();
  return {
    ...params,
    title: params.title.trim(),
    items: params.items ?? [],
    id: params.id ?? (newId() as PublicationId),
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  };
}

export function applyPublicationPatch(
  publication: Publication,
  patch: Partial<Omit<Publication, 'id' | 'createdAt'>>,
): Publication {
  const updated: Publication = {
    ...publication,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : publication.title,
    updatedAt: new Date().toISOString(),
  };
  validatePublicationInvariant(updated);
  return updated;
}

export type CreatePublicationItemParams = Omit<
  PublicationItem,
  'id'
> & {
  readonly id?: PublicationItemId;
};

export function createPublicationItem(params: CreatePublicationItemParams): PublicationItem {
  if (params.position < 0 || !Number.isInteger(params.position)) {
    throw new Error(`PublicationItem position must be a non-negative integer, got ${params.position}`);
  }
  return {
    ...params,
    id: params.id ?? (newId() as PublicationItemId),
  };
}
