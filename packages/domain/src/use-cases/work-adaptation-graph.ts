import {
  WorkId,
  WorkRelationId,
} from '@grimoire/shared';
import {
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  Work,
} from '../entities/work.js';
import {
  WorkRelation,
  WorkRelationType,
  getInverseRelationType,
  invertWorkRelation,
  validateWorkRelationInvariant,
} from '../entities/work-relation.js';

// ---------------------------------------------------------------------------
// Graph Types & Interfaces
// ---------------------------------------------------------------------------

/**
 * Directed edge representing a relation connecting two works in the graph.
 */
export interface GraphEdge {
  readonly targetWorkId: WorkId;
  readonly relationType: WorkRelationType;
  readonly relation: WorkRelation;
  readonly isInverted: boolean;
}

/**
 * Enriched Work node returned by relationship queries.
 * Conforms fully to Work while providing direct access to relationship metadata.
 */
export type RelatedWorkResult = Work & {
  readonly workId: WorkId;
  readonly relationType: WorkRelationType;
  readonly relation: WorkRelation;
  readonly work: Work;
  readonly notes: string | null;
};

/**
 * Enriched Work node in a chronological sequence with its ordinal position.
 */
export type ChronologicalWorkResult = Work & {
  readonly workId: WorkId;
  readonly work: Work;
  readonly sequenceIndex: number;
};

/**
 * Queryable work relation graph representing works and their interconnected relationships.
 */
export interface WorkRelationGraph {
  readonly relations: readonly WorkRelation[];
  readonly works: ReadonlyMap<WorkId, Work>;
  readonly adjacencyList: ReadonlyMap<WorkId, readonly GraphEdge[]>;

  /**
   * Retrieves all works directly related to the given workId, optionally filtered by relation type.
   */
  getRelatedWorks(workId: WorkId, filterType?: WorkRelationType): readonly RelatedWorkResult[];

  /**
   * Retrieves all adaptations derived from the given workId.
   */
  getAdaptations(workId: WorkId, options?: { transitive?: boolean }): readonly RelatedWorkResult[];

  /**
   * Retrieves the full chronological reading/viewing sequence for the series containing workId.
   * Traverses sequels and prequels to return works ordered from earliest to latest.
   */
  getChronologicalSequence(workId: WorkId): readonly ChronologicalWorkResult[];

  /**
   * Retrieves the original source work that workId was adapted from, if any.
   */
  getOriginalWork(workId: WorkId): RelatedWorkResult | null;

  /**
   * Retrieves all direct relations from workId (alias for getRelatedWorks).
   */
  getDirectRelations(workId: WorkId): readonly RelatedWorkResult[];

  /**
   * Returns true if the work has any relations in the graph.
   */
  hasRelations(workId: WorkId): boolean;
}

// ---------------------------------------------------------------------------
// Cycle Detection & Invariants
// ---------------------------------------------------------------------------

/**
 * Detects if a cycle exists within linear temporal relations (Sequels and Prequels).
 * Returns the cycle path as an array of WorkIds if a cycle exists, or null otherwise.
 */
export function detectTemporalCycle(relations: readonly WorkRelation[]): WorkId[] | null {
  // Build directed temporal graph where u -> v means "u comes before v chronologically"
  const temporalAdj = new Map<WorkId, Set<WorkId>>();
  const allNodes = new Set<WorkId>();

  function addTemporalEdge(from: WorkId, to: WorkId): void {
    allNodes.add(from);
    allNodes.add(to);
    let neighbors = temporalAdj.get(from);
    if (!neighbors) {
      neighbors = new Set<WorkId>();
      temporalAdj.set(from, neighbors);
    }
    neighbors.add(to);
  }

  for (const relation of relations) {
    if (relation.relationType === WorkRelationType.Prequel) {
      // source is prequel of target => source comes before target
      addTemporalEdge(relation.sourceWorkId, relation.targetWorkId);
    } else if (relation.relationType === WorkRelationType.Sequel) {
      // source is sequel of target => target comes before source
      addTemporalEdge(relation.targetWorkId, relation.sourceWorkId);
    }
  }

  // 0 = unvisited, 1 = visiting (recursion stack), 2 = visited
  const visitState = new Map<WorkId, number>();
  const parent = new Map<WorkId, WorkId>();

  for (const startNode of allNodes) {
    if ((visitState.get(startNode) ?? 0) !== 0) {
      continue;
    }

    const cyclePath = dfsCycleCheck(startNode, temporalAdj, visitState, parent);
    if (cyclePath) {
      return cyclePath;
    }
  }

  return null;
}

function dfsCycleCheck(
  current: WorkId,
  adj: Map<WorkId, Set<WorkId>>,
  visitState: Map<WorkId, number>,
  parent: Map<WorkId, WorkId>,
): WorkId[] | null {
  visitState.set(current, 1); // visiting
  const neighbors = adj.get(current) ?? new Set<WorkId>();

  for (const neighbor of neighbors) {
    const state = visitState.get(neighbor) ?? 0;
    if (state === 1) {
      // Cycle detected: reconstruct path from neighbor back to current, then to neighbor
      const path: WorkId[] = [neighbor];
      let curr: WorkId = current;
      while (curr !== neighbor) {
        path.unshift(curr);
        curr = parent.get(curr)!;
      }
      path.unshift(neighbor);
      return path;
    }

    if (state === 0) {
      parent.set(neighbor, current);
      const cycle = dfsCycleCheck(neighbor, adj, visitState, parent);
      if (cycle) {
        return cycle;
      }
    }
  }

  visitState.set(current, 2); // visited
  return null;
}

/**
 * Returns true if the given relations contain a temporal cycle (loop in Sequel/Prequel).
 */
export function hasTemporalCycle(relations: readonly WorkRelation[]): boolean {
  return detectTemporalCycle(relations) !== null;
}

/**
 * Asserts that the relations do not form a temporal cycle.
 * @throws {Error} If a cycle is detected.
 */
export function assertNoTemporalCycles(relations: readonly WorkRelation[]): void {
  const cycle = detectTemporalCycle(relations);
  if (cycle) {
    throw new Error(
      `WorkRelation invariant violated: cycle detected in linear temporal relations: ${cycle.join(' -> ')}`,
    );
  }
}

/**
 * Validates graph invariants on a collection of relations:
 * 1. Self-relations are forbidden (sourceWorkId === targetWorkId).
 * 2. Duplicate relations between the same pair of works are forbidden.
 * 3. Linear temporal relations (Sequels/Prequels) cannot form loops.
 *
 * @throws {Error} On invariant violation.
 */
export function validateWorkRelationGraph(relations: readonly WorkRelation[]): void {
  const seenPairs = new Set<string>();

  for (const relation of relations) {
    validateWorkRelationInvariant(relation);

    const pairKey = [relation.sourceWorkId, relation.targetWorkId].sort().join('<->');
    if (seenPairs.has(pairKey)) {
      throw new Error(
        `WorkRelation invariant violated: duplicate relation between the same pair of works (${relation.sourceWorkId} and ${relation.targetWorkId})`,
      );
    }
    seenPairs.add(pairKey);
  }

  assertNoTemporalCycles(relations);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlaceholderWork(id: WorkId): Work {
  const now = new Date().toISOString();
  return {
    id,
    title: `Work (${id})`,
    alternativeTitles: [],
    aliases: [],
    description: null,
    contentType: ContentType.Manga,
    origin: ContentOrigin.Unknown,
    publicationState: PublicationState.Unknown,
    privacyState: PrivacyState.Public,
    coverRef: null,
    externalIds: [],
    genres: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    mergedIntoWorkId: null,
  };
}

function enrichWorkNode(
  targetWorkId: WorkId,
  worksMap: Map<WorkId, Work>,
  edge: GraphEdge,
): RelatedWorkResult {
  const work = worksMap.get(targetWorkId) ?? createPlaceholderWork(targetWorkId);
  return {
    ...work,
    workId: targetWorkId,
    relationType: edge.relationType,
    relation: edge.relation,
    work,
    notes: edge.relation.notes ?? edge.relation.description ?? null,
  };
}

// ---------------------------------------------------------------------------
// Graph Builder Implementation
// ---------------------------------------------------------------------------

/**
 * Builds a bi-directional WorkRelationGraph from a set of relations and optional works.
 *
 * Automatically builds an adjacency list with inverted mappings:
 * - If A is AdaptationOf B, B has inverse relation OriginalWorkOf to A.
 * - If A is Prequel of B, B has inverse relation Sequel to A.
 * - If A is Sequel of B, B has inverse relation Prequel to A.
 * - SpinOff, SideStory, and Related map to themselves reciprocally.
 *
 * Enforces graph invariants:
 * - Prevents self-relations
 * - Prevents duplicate relations between the same pair
 * - Detects and prevents cycles in linear temporal relations
 */
export function buildWorkRelationGraph(
  relations: readonly WorkRelation[],
  works?: readonly Work[] | Iterable<Work>,
): WorkRelationGraph {
  validateWorkRelationGraph(relations);

  const worksMap = new Map<WorkId, Work>();
  if (works) {
    for (const work of works) {
      worksMap.set(work.id, work);
    }
  }

  const adjacencyList = new Map<WorkId, GraphEdge[]>();

  function addEdge(sourceId: WorkId, edge: GraphEdge): void {
    let edges = adjacencyList.get(sourceId);
    if (!edges) {
      edges = [];
      adjacencyList.set(sourceId, edges);
    }
    edges.push(edge);
  }

  // Populate bi-directional adjacency list
  for (const relation of relations) {
    // Forward edge
    addEdge(relation.sourceWorkId, {
      targetWorkId: relation.targetWorkId,
      relationType: relation.relationType,
      relation,
      isInverted: false,
    });

    // Reciprocal inverted edge
    addEdge(relation.targetWorkId, {
      targetWorkId: relation.sourceWorkId,
      relationType: getInverseRelationType(relation.relationType),
      relation: invertWorkRelation(relation),
      isInverted: true,
    });
  }

  return {
    relations: Object.freeze([...relations]),
    works: worksMap,
    adjacencyList,

    getRelatedWorks(workId: WorkId, filterType?: WorkRelationType): readonly RelatedWorkResult[] {
      const edges = adjacencyList.get(workId) ?? [];
      const filtered = filterType ? edges.filter((e) => e.relationType === filterType) : edges;
      return filtered.map((e) => enrichWorkNode(e.targetWorkId, worksMap, e));
    },

    getAdaptations(workId: WorkId, options?: { transitive?: boolean }): readonly RelatedWorkResult[] {
      const transitive = options?.transitive ?? false;
      const results: RelatedWorkResult[] = [];
      const visited = new Set<WorkId>();

      const queue: WorkId[] = [workId];
      visited.add(workId);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const edges = adjacencyList.get(currentId) ?? [];

        // Targets where currentId is the original work are adaptations of currentId
        const adaptationEdges = edges.filter(
          (e) => e.relationType === WorkRelationType.OriginalWorkOf,
        );

        for (const edge of adaptationEdges) {
          if (!visited.has(edge.targetWorkId)) {
            visited.add(edge.targetWorkId);
            results.push(enrichWorkNode(edge.targetWorkId, worksMap, edge));
            if (transitive) {
              queue.push(edge.targetWorkId);
            }
          }
        }
      }

      return results;
    },

    getOriginalWork(workId: WorkId): RelatedWorkResult | null {
      const edges = adjacencyList.get(workId) ?? [];
      // An edge with AdaptationOf indicates that workId was adapted from targetWorkId
      const originalEdge = edges.find((e) => e.relationType === WorkRelationType.AdaptationOf);
      if (!originalEdge) {
        return null;
      }
      return enrichWorkNode(originalEdge.targetWorkId, worksMap, originalEdge);
    },

    getChronologicalSequence(workId: WorkId): readonly ChronologicalWorkResult[] {
      // 1. Collect all works in the connected temporal component containing workId
      const componentNodes = new Set<WorkId>();
      const queue: WorkId[] = [workId];
      componentNodes.add(workId);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const edges = adjacencyList.get(curr) ?? [];
        for (const edge of edges) {
          if (
            edge.relationType === WorkRelationType.Sequel ||
            edge.relationType === WorkRelationType.Prequel
          ) {
            if (!componentNodes.has(edge.targetWorkId)) {
              componentNodes.add(edge.targetWorkId);
              queue.push(edge.targetWorkId);
            }
          }
        }
      }

      // If work is standalone, return it as sequence of 1
      if (componentNodes.size === 1) {
        const singleWork = worksMap.get(workId) ?? createPlaceholderWork(workId);
        return [
          {
            ...singleWork,
            workId,
            work: singleWork,
            sequenceIndex: 0,
          },
        ];
      }

      // 2. Build directed chronological DAG within the component
      // In our graph:
      // If edge from u to v has relationType Prequel => u is prequel of v => u < v (u comes before v)
      // If edge from u to v has relationType Sequel => u is sequel of v => v < u (v comes before u)
      const forwardAdj = new Map<WorkId, Set<WorkId>>();
      const inDegree = new Map<WorkId, number>();

      for (const node of componentNodes) {
        forwardAdj.set(node, new Set<WorkId>());
        inDegree.set(node, 0);
      }

      for (const u of componentNodes) {
        const edges = adjacencyList.get(u) ?? [];
        for (const edge of edges) {
          if (componentNodes.has(edge.targetWorkId)) {
            if (edge.relationType === WorkRelationType.Prequel) {
              // u is prequel of target => u comes before target
              const targets = forwardAdj.get(u)!;
              if (!targets.has(edge.targetWorkId)) {
                targets.add(edge.targetWorkId);
                inDegree.set(edge.targetWorkId, (inDegree.get(edge.targetWorkId) ?? 0) + 1);
              }
            }
          }
        }
      }

      // 3. Topological sort using Kahn's algorithm
      const readyQueue: WorkId[] = [];
      for (const node of componentNodes) {
        if ((inDegree.get(node) ?? 0) === 0) {
          readyQueue.push(node);
        }
      }

      // Sort ready queue deterministically by work ID
      readyQueue.sort((a, b) => a.localeCompare(b));

      const orderedSequence: WorkId[] = [];

      while (readyQueue.length > 0) {
        const current = readyQueue.shift()!;
        orderedSequence.push(current);

        const successors = forwardAdj.get(current) ?? new Set<WorkId>();
        const nextReady: WorkId[] = [];
        for (const successor of successors) {
          const newDeg = (inDegree.get(successor) ?? 1) - 1;
          inDegree.set(successor, newDeg);
          if (newDeg === 0) {
            nextReady.push(successor);
          }
        }
        nextReady.sort((a, b) => a.localeCompare(b));
        readyQueue.push(...nextReady);
      }

      // Fallback check in case an undetected loop prevented full ordering
      if (orderedSequence.length < componentNodes.size) {
        for (const node of componentNodes) {
          if (!orderedSequence.includes(node)) {
            orderedSequence.push(node);
          }
        }
      }

      return orderedSequence.map((id, index) => {
        const work = worksMap.get(id) ?? createPlaceholderWork(id);
        return {
          ...work,
          workId: id,
          work,
          sequenceIndex: index,
        };
      });
    },

    getDirectRelations(workId: WorkId): readonly RelatedWorkResult[] {
      return this.getRelatedWorks(workId);
    },

    hasRelations(workId: WorkId): boolean {
      return (adjacencyList.get(workId)?.length ?? 0) > 0;
    },
  };
}
