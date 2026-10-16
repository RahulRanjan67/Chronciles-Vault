import {
  WorkRelationId,
  WorkId,
  newId,
} from '@chronicles-vault/shared';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Directional relationship type between two Works.
 */
export enum WorkRelationType {
  AdaptationOf = 'adaptation_of',
  OriginalWorkOf = 'original_work_of',
  Sequel = 'sequel',
  Prequel = 'prequel',
  SpinOff = 'spin_off',
  SideStory = 'side_story',
  Related = 'related',
  FanfictionOf = 'fanfiction_of',
  ParentWorkOf = 'parent_work_of',
}

/**
 * Backward compatibility alias for WorkRelationType.
 * @deprecated Use `WorkRelationType` instead.
 */
export const RelationType = WorkRelationType;
/** @deprecated Use `WorkRelationType` instead. */
export type RelationType = WorkRelationType;

// ---------------------------------------------------------------------------
// Invertible Relationship Mapping
// ---------------------------------------------------------------------------

/**
 * Canonical inverse mapping between WorkRelationTypes.
 * Every relation type maps to an inverse such that invert(invert(type)) === type.
 */
export const INVERSE_RELATION_MAP: Readonly<Record<WorkRelationType, WorkRelationType>> = {
  [WorkRelationType.AdaptationOf]: WorkRelationType.OriginalWorkOf,
  [WorkRelationType.OriginalWorkOf]: WorkRelationType.AdaptationOf,
  [WorkRelationType.Sequel]: WorkRelationType.Prequel,
  [WorkRelationType.Prequel]: WorkRelationType.Sequel,
  [WorkRelationType.SpinOff]: WorkRelationType.SpinOff,
  [WorkRelationType.SideStory]: WorkRelationType.SideStory,
  [WorkRelationType.Related]: WorkRelationType.Related,
  [WorkRelationType.FanfictionOf]: WorkRelationType.ParentWorkOf,
  [WorkRelationType.ParentWorkOf]: WorkRelationType.FanfictionOf,
};

/**
 * Retrieves the inverse relation type for a given WorkRelationType.
 */
export function getInverseRelationType(relationType: WorkRelationType): WorkRelationType {
  const inverse = INVERSE_RELATION_MAP[relationType];
  if (!inverse) {
    throw new Error(`No inverse mapping found for relation type: ${relationType}`);
  }
  return inverse;
}

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

/**
 * Directed link connecting one Work to another (e.g. Manga -> Anime adaptation, or Book 2 -> Book 1 Sequel).
 */
export interface WorkRelation {
  readonly id: WorkRelationId;
  readonly sourceWorkId: WorkId;
  readonly targetWorkId: WorkId;
  readonly relationType: WorkRelationType;
  /** Canonical context/note for this work relationship (matches SQLite `work_relations.notes`). */
  readonly notes: string | null;
  /** @deprecated Mirror of `notes` retained for backward compatibility. Prefer `relation.notes`. */
  readonly description?: string | null;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

export function validateWorkRelationInvariant(
  candidate: Pick<WorkRelation, 'sourceWorkId' | 'targetWorkId'>,
): void {
  if (!candidate.sourceWorkId || !candidate.targetWorkId) {
    throw new Error('WorkRelation invariant violated: sourceWorkId and targetWorkId must be provided');
  }
  if (candidate.sourceWorkId === candidate.targetWorkId) {
    throw new Error('WorkRelation invariant violated: work cannot be related to itself');
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers & Transformation
// ---------------------------------------------------------------------------

export interface CreateWorkRelationParams {
  readonly id?: WorkRelationId;
  readonly sourceWorkId: WorkId;
  readonly targetWorkId: WorkId;
  readonly relationType: WorkRelationType;
  readonly notes?: string | null;
  readonly description?: string | null;
  readonly createdAt?: string;
}

export function createWorkRelation(params: CreateWorkRelationParams): WorkRelation {
  validateWorkRelationInvariant(params);
  const notes = params.notes ?? params.description ?? null;
  return {
    id: params.id ?? (newId() as WorkRelationId),
    sourceWorkId: params.sourceWorkId,
    targetWorkId: params.targetWorkId,
    relationType: params.relationType,
    notes,
    description: notes,
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Returns an inverted WorkRelation where source and target are swapped,
 * and the relationType is inverted according to INVERSE_RELATION_MAP.
 */
export function invertWorkRelation(relation: WorkRelation): WorkRelation {
  return {
    ...relation,
    sourceWorkId: relation.targetWorkId,
    targetWorkId: relation.sourceWorkId,
    relationType: getInverseRelationType(relation.relationType),
  };
}
