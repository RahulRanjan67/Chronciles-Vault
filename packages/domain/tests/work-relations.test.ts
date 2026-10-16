import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  WorkId,
  WorkRelationId,
  Work,
  WorkRelation,
} from '../dist/index.js';
import {
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  createWork,
  WorkRelationType,
  RelationType,
  createWorkRelation,
  validateWorkRelationInvariant,
  INVERSE_RELATION_MAP,
  getInverseRelationType,
  invertWorkRelation,
  validateWorkRelationGraph,
  detectTemporalCycle,
  hasTemporalCycle,
  assertNoTemporalCycles,
  buildWorkRelationGraph,
} from '../dist/index.js';

function createMockWork(id: string, title: string, contentType: ContentType = ContentType.LightNovel): Work {
  const now = '2026-10-05T00:00:00.000Z';
  return {
    id: id as WorkId,
    title,
    alternativeTitles: [],
    aliases: [],
    description: null,
    contentType,
    origin: ContentOrigin.Japanese,
    publicationState: PublicationState.Completed,
    privacyState: PrivacyState.Public,
    coverRef: null,
    externalIds: [],
    genres: ['Fantasy'],
    tags: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    mergedIntoWorkId: null,
  };
}

describe('Cycle 9: Work Adaptation Graph & Relationship Engine', () => {
  // =========================================================================
  // 1. Relationship Types & Models
  // =========================================================================
  describe('Relationship Types & Models', () => {
    it('defines all required WorkRelationType enum values and backward compatible RelationType alias', () => {
      assert.equal(WorkRelationType.AdaptationOf, 'adaptation_of');
      assert.equal(WorkRelationType.OriginalWorkOf, 'original_work_of');
      assert.equal(WorkRelationType.Sequel, 'sequel');
      assert.equal(WorkRelationType.Prequel, 'prequel');
      assert.equal(WorkRelationType.SpinOff, 'spin_off');
      assert.equal(WorkRelationType.SideStory, 'side_story');
      assert.equal(WorkRelationType.Related, 'related');

      // Backward compatibility alias check
      assert.equal(RelationType.Sequel, WorkRelationType.Sequel);
      assert.equal(RelationType.AdaptationOf, WorkRelationType.AdaptationOf);
    });

    it('creates a validated WorkRelation entity with defaults and notes', () => {
      const relation = createWorkRelation({
        sourceWorkId: 'work-1' as WorkId,
        targetWorkId: 'work-2' as WorkId,
        relationType: WorkRelationType.AdaptationOf,
        notes: 'TV Anime adaptation produced by Studio Bind',
      });

      assert.ok(relation.id);
      assert.equal(relation.sourceWorkId, 'work-1');
      assert.equal(relation.targetWorkId, 'work-2');
      assert.equal(relation.relationType, WorkRelationType.AdaptationOf);
      assert.equal(relation.notes, 'TV Anime adaptation produced by Studio Bind');
      assert.equal(relation.description, 'TV Anime adaptation produced by Studio Bind');
      assert.ok(relation.createdAt);
    });

    it('supports custom id, createdAt timestamp, and description parameter', () => {
      const customId = 'rel-custom-123' as WorkRelationId;
      const customDate = '2026-01-01T12:00:00.000Z';
      const relation = createWorkRelation({
        id: customId,
        sourceWorkId: 'work-a' as WorkId,
        targetWorkId: 'work-b' as WorkId,
        relationType: WorkRelationType.SpinOff,
        description: 'Chibi comedic spin-off',
        createdAt: customDate,
      });

      assert.equal(relation.id, customId);
      assert.equal(relation.createdAt, customDate);
      assert.equal(relation.notes, 'Chibi comedic spin-off');
      assert.equal(relation.description, 'Chibi comedic spin-off');
    });

    it('provides exhaustive invertible relationship mapping for all relation types', () => {
      // Direct pairings
      assert.equal(getInverseRelationType(WorkRelationType.AdaptationOf), WorkRelationType.OriginalWorkOf);
      assert.equal(getInverseRelationType(WorkRelationType.OriginalWorkOf), WorkRelationType.AdaptationOf);
      assert.equal(getInverseRelationType(WorkRelationType.Sequel), WorkRelationType.Prequel);
      assert.equal(getInverseRelationType(WorkRelationType.Prequel), WorkRelationType.Sequel);

      // Symmetric pairings
      assert.equal(getInverseRelationType(WorkRelationType.SpinOff), WorkRelationType.SpinOff);
      assert.equal(getInverseRelationType(WorkRelationType.SideStory), WorkRelationType.SideStory);
      assert.equal(getInverseRelationType(WorkRelationType.Related), WorkRelationType.Related);

      // Verify involution property: invert(invert(type)) === type for every type
      for (const type of Object.values(WorkRelationType)) {
        const inv = getInverseRelationType(type);
        assert.equal(getInverseRelationType(inv), type);
      }
    });

    it('inverts a WorkRelation entity swapping source and target with inverted relation type', () => {
      const rel = createWorkRelation({
        id: 'rel-1' as WorkRelationId,
        sourceWorkId: 'work-anime' as WorkId,
        targetWorkId: 'work-manga' as WorkId,
        relationType: WorkRelationType.AdaptationOf,
        notes: 'Broadcast anime',
      });

      const inverted = invertWorkRelation(rel);
      assert.equal(inverted.sourceWorkId, 'work-manga');
      assert.equal(inverted.targetWorkId, 'work-anime');
      assert.equal(inverted.relationType, WorkRelationType.OriginalWorkOf);
      assert.equal(inverted.notes, 'Broadcast anime');

      // Double inversion restores original
      const doubleInverted = invertWorkRelation(inverted);
      assert.equal(doubleInverted.sourceWorkId, 'work-anime');
      assert.equal(doubleInverted.targetWorkId, 'work-manga');
      assert.equal(doubleInverted.relationType, WorkRelationType.AdaptationOf);
    });
  });

  // =========================================================================
  // 2. Cycle Detection & Graph Invariants
  // =========================================================================
  describe('Cycle Detection & Graph Invariants', () => {
    it('prevents self-relations where sourceWorkId equals targetWorkId', () => {
      assert.throws(() => {
        validateWorkRelationInvariant({
          sourceWorkId: 'work-1' as WorkId,
          targetWorkId: 'work-1' as WorkId,
        });
      }, /cannot be related to itself/);

      assert.throws(() => {
        createWorkRelation({
          sourceWorkId: 'work-x' as WorkId,
          targetWorkId: 'work-x' as WorkId,
          relationType: WorkRelationType.Related,
        });
      }, /cannot be related to itself/);

      assert.throws(() => {
        validateWorkRelationGraph([
          createWorkRelation({
            sourceWorkId: 'work-y' as WorkId,
            targetWorkId: 'work-y' as WorkId,
            relationType: WorkRelationType.Sequel,
          }),
        ]);
      }, /cannot be related to itself/);
    });

    it('prevents duplicate relations between the same pair in the same direction', () => {
      const rel1 = createWorkRelation({
        sourceWorkId: 'work-1' as WorkId,
        targetWorkId: 'work-2' as WorkId,
        relationType: WorkRelationType.Related,
      });
      const rel2 = createWorkRelation({
        sourceWorkId: 'work-1' as WorkId,
        targetWorkId: 'work-2' as WorkId,
        relationType: WorkRelationType.Related,
      });

      assert.throws(() => {
        validateWorkRelationGraph([rel1, rel2]);
      }, /duplicate relation between the same pair of works/i);

      assert.throws(() => {
        buildWorkRelationGraph([rel1, rel2]);
      }, /duplicate relation between the same pair of works/i);
    });

    it('prevents duplicate relations between the same pair in opposite directions', () => {
      const rel1 = createWorkRelation({
        sourceWorkId: 'work-1' as WorkId,
        targetWorkId: 'work-2' as WorkId,
        relationType: WorkRelationType.Prequel,
      });
      const rel2 = createWorkRelation({
        sourceWorkId: 'work-2' as WorkId,
        targetWorkId: 'work-1' as WorkId,
        relationType: WorkRelationType.Sequel,
      });

      assert.throws(() => {
        validateWorkRelationGraph([rel1, rel2]);
      }, /duplicate relation between the same pair of works/i);
    });

    it('detects 2-node cycles in temporal relations (e.g. A is Sequel of B and B is Sequel of A)', () => {
      // In a 2-node cycle with different pairs, e.g. A Sequel B (B < A) and B Sequel C (C < B) and C Sequel A (A < C)
      const rels = [
        createWorkRelation({ sourceWorkId: 'w1' as WorkId, targetWorkId: 'w2' as WorkId, relationType: WorkRelationType.Prequel }),
        createWorkRelation({ sourceWorkId: 'w2' as WorkId, targetWorkId: 'w3' as WorkId, relationType: WorkRelationType.Prequel }),
        createWorkRelation({ sourceWorkId: 'w3' as WorkId, targetWorkId: 'w1' as WorkId, relationType: WorkRelationType.Prequel }),
      ];

      assert.equal(hasTemporalCycle(rels), true);
      const cycle = detectTemporalCycle(rels);
      assert.ok(cycle);
      assert.ok(cycle.length >= 3);

      assert.throws(() => {
        assertNoTemporalCycles(rels);
      }, /cycle detected in linear temporal relations/i);

      assert.throws(() => {
        buildWorkRelationGraph(rels);
      }, /cycle detected in linear temporal relations/i);
    });

    it('detects complex mixed Sequel/Prequel loops', () => {
      // w1 prequel w2 (w1 < w2)
      // w3 sequel w2 (w2 < w3)
      // w1 sequel w3 (w3 < w1) -> forms loop: w1 < w2 < w3 < w1
      const rels = [
        createWorkRelation({ sourceWorkId: 'w1' as WorkId, targetWorkId: 'w2' as WorkId, relationType: WorkRelationType.Prequel }),
        createWorkRelation({ sourceWorkId: 'w3' as WorkId, targetWorkId: 'w2' as WorkId, relationType: WorkRelationType.Sequel }),
        createWorkRelation({ sourceWorkId: 'w1' as WorkId, targetWorkId: 'w3' as WorkId, relationType: WorkRelationType.Sequel }),
      ];

      assert.equal(hasTemporalCycle(rels), true);
      assert.throws(() => {
        validateWorkRelationGraph(rels);
      }, /cycle detected in linear temporal relations/i);
    });

    it('allows non-temporal relation loops (e.g. triangle of Related works in shared universe)', () => {
      const rels = [
        createWorkRelation({ sourceWorkId: 'w1' as WorkId, targetWorkId: 'w2' as WorkId, relationType: WorkRelationType.Related }),
        createWorkRelation({ sourceWorkId: 'w2' as WorkId, targetWorkId: 'w3' as WorkId, relationType: WorkRelationType.Related }),
        createWorkRelation({ sourceWorkId: 'w3' as WorkId, targetWorkId: 'w1' as WorkId, relationType: WorkRelationType.Related }),
      ];

      assert.equal(hasTemporalCycle(rels), false);
      assert.doesNotThrow(() => {
        validateWorkRelationGraph(rels);
      });
      assert.doesNotThrow(() => {
        buildWorkRelationGraph(rels);
      });
    });

    it('allows branching temporal relations (DAG with shared prequel or shared sequel)', () => {
      // Branching: Book 1 has Sequel Book 2A and Sequel Book 2B (e.g. branching routes)
      const rels = [
        createWorkRelation({ sourceWorkId: 'book-2a' as WorkId, targetWorkId: 'book-1' as WorkId, relationType: WorkRelationType.Sequel }),
        createWorkRelation({ sourceWorkId: 'book-2b' as WorkId, targetWorkId: 'book-1' as WorkId, relationType: WorkRelationType.Sequel }),
      ];

      assert.equal(hasTemporalCycle(rels), false);
      assert.doesNotThrow(() => {
        validateWorkRelationGraph(rels);
      });
    });
  });

  // =========================================================================
  // 3. Graph Builder & Traversal Queries
  // =========================================================================
  describe('Graph Builder & Traversal Queries', () => {
    const novel = createMockWork('work-novel', 'Solo Leveling (Novel)', ContentType.LightNovel);
    const manhwa = createMockWork('work-manhwa', 'Solo Leveling (Webtoon)', ContentType.Webtoon);
    const anime = createMockWork('work-anime', 'Solo Leveling (Anime)', ContentType.Anime);
    const sideStory = createMockWork('work-sidestory', 'Solo Leveling: Side Story', ContentType.Webtoon);
    const ragnarok = createMockWork('work-ragnarok', 'Solo Leveling: Ragnarok', ContentType.WebNovel);
    const game = createMockWork('work-game', 'Solo Leveling: Arise', ContentType.WesternNovel);

    const relations = [
      // Manhwa is AdaptationOf Novel => Novel is OriginalWorkOf Manhwa
      createWorkRelation({
        sourceWorkId: manhwa.id,
        targetWorkId: novel.id,
        relationType: WorkRelationType.AdaptationOf,
        notes: 'Webtoon adaptation by Redice Studio',
      }),
      // Anime is AdaptationOf Novel => Novel is OriginalWorkOf Anime
      createWorkRelation({
        sourceWorkId: anime.id,
        targetWorkId: novel.id,
        relationType: WorkRelationType.AdaptationOf,
        notes: 'A-1 Pictures Anime Adaptation',
      }),
      // Ragnarok is Sequel to Manhwa => Manhwa is Prequel to Ragnarok
      createWorkRelation({
        sourceWorkId: ragnarok.id,
        targetWorkId: manhwa.id,
        relationType: WorkRelationType.Sequel,
        notes: 'Sequel series following Sung Suho',
      }),
      // SideStory is SideStory of Manhwa
      createWorkRelation({
        sourceWorkId: sideStory.id,
        targetWorkId: manhwa.id,
        relationType: WorkRelationType.SideStory,
      }),
      // Game is SpinOff of Novel
      createWorkRelation({
        sourceWorkId: game.id,
        targetWorkId: novel.id,
        relationType: WorkRelationType.SpinOff,
      }),
    ];

    const allWorks = [novel, manhwa, anime, sideStory, ragnarok, game];

    it('builds an adjacency list with bidirectional relations and inverted mappings', () => {
      const graph = buildWorkRelationGraph(relations, allWorks);

      assert.equal(graph.hasRelations(novel.id), true);
      assert.equal(graph.hasRelations(manhwa.id), true);
      assert.equal(graph.hasRelations('unknown-work' as WorkId), false);

      // Verify novel direct relations: Manhwa (OriginalWorkOf), Anime (OriginalWorkOf), Game (SpinOff)
      const novelRelations = graph.getRelatedWorks(novel.id);
      assert.equal(novelRelations.length, 3);
      const types = novelRelations.map((r) => r.relationType);
      assert.ok(types.includes(WorkRelationType.OriginalWorkOf));
      assert.ok(types.includes(WorkRelationType.SpinOff));
    });

    describe('getRelatedWorks', () => {
      it('returns all related works and allows filtering by relation type', () => {
        const graph = buildWorkRelationGraph(relations, allWorks);

        // All relations of manhwa: Novel (AdaptationOf), Ragnarok (Prequel), SideStory (SideStory)
        const manhwaRelations = graph.getRelatedWorks(manhwa.id);
        assert.equal(manhwaRelations.length, 3);

        // Filter by relation type
        const adaptRelations = graph.getRelatedWorks(manhwa.id, WorkRelationType.AdaptationOf);
        assert.equal(adaptRelations.length, 1);
        assert.equal(adaptRelations[0].id, novel.id);
        assert.equal(adaptRelations[0].title, 'Solo Leveling (Novel)');
        assert.equal(adaptRelations[0].relationType, WorkRelationType.AdaptationOf);
        assert.equal(adaptRelations[0].workId, novel.id);
        assert.equal(adaptRelations[0].work.id, novel.id);

        const prequelRelations = graph.getRelatedWorks(manhwa.id, WorkRelationType.Prequel);
        assert.equal(prequelRelations.length, 1);
        assert.equal(prequelRelations[0].id, ragnarok.id);
      });

      it('returns empty array when querying an isolated work with no relations', () => {
        const standalone = createMockWork('work-standalone', 'Standalone Book');
        const graph = buildWorkRelationGraph(relations, [...allWorks, standalone]);

        assert.deepEqual(graph.getRelatedWorks(standalone.id), []);
        assert.deepEqual(graph.getRelatedWorks('non-existent' as WorkId), []);
      });
    });

    describe('getAdaptations', () => {
      it('retrieves direct adaptations of the original work', () => {
        const graph = buildWorkRelationGraph(relations, allWorks);

        const novelAdaptations = graph.getAdaptations(novel.id);
        assert.equal(novelAdaptations.length, 2);

        const titles = novelAdaptations.map((a) => a.title);
        assert.ok(titles.includes('Solo Leveling (Webtoon)'));
        assert.ok(titles.includes('Solo Leveling (Anime)'));

        // Each returned adaptation conforms to Work and contains relation metadata
        for (const adaptation of novelAdaptations) {
          assert.equal(adaptation.relationType, WorkRelationType.OriginalWorkOf);
          assert.ok(adaptation.id);
          assert.ok(adaptation.contentType);
        }
      });

      it('returns empty array for a work that has no downstream adaptations', () => {
        const graph = buildWorkRelationGraph(relations, allWorks);

        // Anime is an adaptation, but has no adaptations derived from it
        const animeAdaptations = graph.getAdaptations(anime.id);
        assert.deepEqual(animeAdaptations, []);
      });

      it('supports transitive multi-tier adaptation chains', () => {
        // Novel -> Manga -> LiveAction
        const liveAction = createMockWork('work-live-action', 'Solo Leveling (Live Action)');
        const chainedRelations = [
          createWorkRelation({
            sourceWorkId: manhwa.id,
            targetWorkId: novel.id,
            relationType: WorkRelationType.AdaptationOf,
          }),
          createWorkRelation({
            sourceWorkId: liveAction.id,
            targetWorkId: manhwa.id,
            relationType: WorkRelationType.AdaptationOf,
          }),
        ];

        const graph = buildWorkRelationGraph(chainedRelations, [novel, manhwa, liveAction]);

        // Direct adaptations of novel: only manhwa
        const direct = graph.getAdaptations(novel.id, { transitive: false });
        assert.equal(direct.length, 1);
        assert.equal(direct[0].id, manhwa.id);

        // Transitive adaptations of novel: manhwa and liveAction
        const transitive = graph.getAdaptations(novel.id, { transitive: true });
        assert.equal(transitive.length, 2);
        const ids = transitive.map((t) => t.id);
        assert.ok(ids.includes(manhwa.id));
        assert.ok(ids.includes(liveAction.id));
      });

      it('provides getOriginalWork helper to retrieve source work', () => {
        const graph = buildWorkRelationGraph(relations, allWorks);

        const original = graph.getOriginalWork(manhwa.id);
        assert.ok(original);
        assert.equal(original.id, novel.id);
        assert.equal(original.relationType, WorkRelationType.AdaptationOf);

        // Novel itself has no original work
        assert.equal(graph.getOriginalWork(novel.id), null);
      });
    });

    describe('getChronologicalSequence', () => {
      it('orders a linear sequence from earliest to latest regardless of query starting work', () => {
        const book1 = createMockWork('hp-1', 'Philosopher Stone');
        const book2 = createMockWork('hp-2', 'Chamber of Secrets');
        const book3 = createMockWork('hp-3', 'Prisoner of Azkaban');
        const book4 = createMockWork('hp-4', 'Goblet of Fire');

        const seriesRelations = [
          createWorkRelation({ sourceWorkId: book2.id, targetWorkId: book1.id, relationType: WorkRelationType.Sequel }),
          createWorkRelation({ sourceWorkId: book3.id, targetWorkId: book2.id, relationType: WorkRelationType.Sequel }),
          createWorkRelation({ sourceWorkId: book4.id, targetWorkId: book3.id, relationType: WorkRelationType.Sequel }),
        ];

        const graph = buildWorkRelationGraph(seriesRelations, [book1, book2, book3, book4]);

        // Querying from book2 should yield the entire series in order
        const seqFromBook2 = graph.getChronologicalSequence(book2.id);
        assert.equal(seqFromBook2.length, 4);
        assert.equal(seqFromBook2[0].id, book1.id);
        assert.equal(seqFromBook2[1].id, book2.id);
        assert.equal(seqFromBook2[2].id, book3.id);
        assert.equal(seqFromBook2[3].id, book4.id);

        assert.equal(seqFromBook2[0].sequenceIndex, 0);
        assert.equal(seqFromBook2[1].sequenceIndex, 1);
        assert.equal(seqFromBook2[2].sequenceIndex, 2);
        assert.equal(seqFromBook2[3].sequenceIndex, 3);

        // Querying from book4 or book1 yields identical order
        const seqFromBook4 = graph.getChronologicalSequence(book4.id);
        assert.deepEqual(
          seqFromBook4.map((w) => w.id),
          seqFromBook2.map((w) => w.id),
        );
      });

      it('handles mixed Prequel and Sequel relations correctly in timeline ordering', () => {
        const prequel = createMockWork('starwars-prequel', 'The Phantom Menace');
        const original = createMockWork('starwars-orig', 'A New Hope');
        const sequel = createMockWork('starwars-sequel', 'The Force Awakens');

        const starWarsRelations = [
          // prequel is Prequel of original (prequel < original)
          createWorkRelation({ sourceWorkId: prequel.id, targetWorkId: original.id, relationType: WorkRelationType.Prequel }),
          // sequel is Sequel of original (original < sequel)
          createWorkRelation({ sourceWorkId: sequel.id, targetWorkId: original.id, relationType: WorkRelationType.Sequel }),
        ];

        const graph = buildWorkRelationGraph(starWarsRelations, [prequel, original, sequel]);

        const seq = graph.getChronologicalSequence(original.id);
        assert.equal(seq.length, 3);
        assert.equal(seq[0].id, prequel.id);
        assert.equal(seq[1].id, original.id);
        assert.equal(seq[2].id, sequel.id);
      });

      it('returns a sequence of length 1 for a standalone work with no temporal connections', () => {
        const standalone = createMockWork('standalone-1', 'Standalone Tale');
        const graph = buildWorkRelationGraph([], [standalone]);

        const seq = graph.getChronologicalSequence(standalone.id);
        assert.equal(seq.length, 1);
        assert.equal(seq[0].id, standalone.id);
        assert.equal(seq[0].sequenceIndex, 0);
      });

      it('isolates independent series components within the same graph', () => {
        const seriesA1 = createMockWork('a-1', 'Series A Vol 1');
        const seriesA2 = createMockWork('a-2', 'Series A Vol 2');
        const seriesB1 = createMockWork('b-1', 'Series B Vol 1');
        const seriesB2 = createMockWork('b-2', 'Series B Vol 2');
        const seriesB3 = createMockWork('b-3', 'Series B Vol 3');

        const multiSeriesRelations = [
          createWorkRelation({ sourceWorkId: seriesA2.id, targetWorkId: seriesA1.id, relationType: WorkRelationType.Sequel }),
          createWorkRelation({ sourceWorkId: seriesB2.id, targetWorkId: seriesB1.id, relationType: WorkRelationType.Sequel }),
          createWorkRelation({ sourceWorkId: seriesB3.id, targetWorkId: seriesB2.id, relationType: WorkRelationType.Sequel }),
        ];

        const graph = buildWorkRelationGraph(multiSeriesRelations, [
          seriesA1,
          seriesA2,
          seriesB1,
          seriesB2,
          seriesB3,
        ]);

        const seqA = graph.getChronologicalSequence(seriesA1.id);
        assert.equal(seqA.length, 2);
        assert.deepEqual(
          seqA.map((w) => w.id),
          [seriesA1.id, seriesA2.id],
        );

        const seqB = graph.getChronologicalSequence(seriesB2.id);
        assert.equal(seqB.length, 3);
        assert.deepEqual(
          seqB.map((w) => w.id),
          [seriesB1.id, seriesB2.id, seriesB3.id],
        );
      });

      it('synthesizes placeholder work nodes gracefully when works metadata is omitted', () => {
        const relationsOnly = [
          createWorkRelation({
            sourceWorkId: 'unregistered-seq' as WorkId,
            targetWorkId: 'unregistered-base' as WorkId,
            relationType: WorkRelationType.Sequel,
          }),
        ];

        // buildWorkRelationGraph called without works list
        const graph = buildWorkRelationGraph(relationsOnly);

        const seq = graph.getChronologicalSequence('unregistered-seq' as WorkId);
        assert.equal(seq.length, 2);
        assert.equal(seq[0].id, 'unregistered-base');
        assert.equal(seq[1].id, 'unregistered-seq');
        assert.ok(seq[0].title.includes('unregistered-base'));
        assert.equal(seq[0].contentType, ContentType.Manga);
      });
    });
  });
});
