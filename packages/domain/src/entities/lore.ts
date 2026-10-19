import {
  LoreEntryId,
  WorkId,
  newId,
} from '@grimoire/shared';
import { ProgressAnchor, validateProgressAnchor } from './progress.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Category of worldbuilding / lore entity within a fictional universe.
 */
export enum LoreEntityType {
  Character = 'character',
  Faction = 'faction',
  Place = 'place',
  Item = 'item',
  Ability = 'ability',
  Terminology = 'terminology',
  Concept = 'concept',
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * Directed relationship between two lore entries (e.g. Character A is member of Faction B).
 */
export interface LoreRelation {
  readonly targetLoreEntryId: LoreEntryId;
  readonly relationType: string;
  readonly description?: string;
}

/**
 * A worldbuilding entry tracking characters, factions, places, abilities, and terminology.
 */
export interface LoreEntry {
  readonly id: LoreEntryId;
  readonly workId: WorkId;
  readonly entityType: LoreEntityType;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly description: string | null;
  readonly notes: string | null;
  readonly relations: readonly LoreRelation[];
  readonly firstAppearsAnchor: ProgressAnchor | null;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

export function validateLoreEntryInvariant(candidate: Pick<LoreEntry, 'name' | 'firstAppearsAnchor'>): void {
  if (!candidate.name || !candidate.name.trim()) {
    throw new Error('LoreEntry invariant violated: name must not be empty');
  }
  if (candidate.firstAppearsAnchor) {
    validateProgressAnchor(candidate.firstAppearsAnchor);
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateLoreEntryParams = Omit<
  LoreEntry,
  'id' | 'createdAt' | 'updatedAt'
> & {
  readonly id?: LoreEntryId;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export function createLoreEntry(params: CreateLoreEntryParams): LoreEntry {
  validateLoreEntryInvariant(params);
  const now = new Date().toISOString();
  return {
    ...params,
    name: params.name.trim(),
    id: params.id ?? (newId() as LoreEntryId),
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  };
}

export function applyLoreEntryPatch(
  entry: LoreEntry,
  patch: Partial<Omit<LoreEntry, 'id' | 'workId' | 'createdAt'>>,
): LoreEntry {
  const updated: LoreEntry = {
    ...entry,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() : entry.name,
    updatedAt: new Date().toISOString(),
  };
  validateLoreEntryInvariant(updated);
  return updated;
}
