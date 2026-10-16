import {
  UserListId,
  ListItemId,
  WorkId,
  newId,
} from '@chronicles-vault/shared';
import { PrivacyState } from './work.js';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/**
 * An ordered membership entry of a Work within a UserList.
 */
export interface ListItem {
  readonly id: ListItemId;
  readonly listId: UserListId;
  readonly workId: WorkId;
  readonly position: number;
  readonly personalNote: string | null;
  readonly createdAt: string;
}

/**
 * Custom user-curated collection or shelf (e.g. "Favorites", "Peak Fiction", "Planning for Summer").
 */
export interface UserList {
  readonly id: UserListId;
  readonly title: string;
  readonly description: string | null;
  readonly privacyState: PrivacyState;
  readonly items: readonly ListItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

export function validateUserListInvariant(candidate: Pick<UserList, 'title'>): void {
  if (!candidate.title || !candidate.title.trim()) {
    throw new Error('UserList invariant violated: title must not be empty');
  }
}

export function validateListItemInvariant(candidate: Pick<ListItem, 'position'>): void {
  if (candidate.position < 0 || !Number.isInteger(candidate.position)) {
    throw new Error(`ListItem invariant violated: position must be a non-negative integer, got ${candidate.position}`);
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateUserListParams = Omit<
  UserList,
  'id' | 'items' | 'createdAt' | 'updatedAt'
> & {
  readonly id?: UserListId;
  readonly items?: readonly ListItem[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export function createUserList(params: CreateUserListParams): UserList {
  validateUserListInvariant(params);
  const now = new Date().toISOString();
  return {
    ...params,
    title: params.title.trim(),
    items: params.items ?? [],
    id: params.id ?? (newId() as UserListId),
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  };
}

export function applyUserListPatch(
  list: UserList,
  patch: Partial<Omit<UserList, 'id' | 'createdAt'>>,
): UserList {
  const updated: UserList = {
    ...list,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : list.title,
    updatedAt: new Date().toISOString(),
  };
  validateUserListInvariant(updated);
  return updated;
}

export type CreateListItemParams = Omit<
  ListItem,
  'id' | 'createdAt'
> & {
  readonly id?: ListItemId;
  readonly createdAt?: string;
};

export function createListItem(params: CreateListItemParams): ListItem {
  validateListItemInvariant(params);
  return {
    ...params,
    id: params.id ?? (newId() as ListItemId),
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}
