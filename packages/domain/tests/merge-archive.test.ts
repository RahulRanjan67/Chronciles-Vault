import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  WorkId,
  AccessPathId,
  ReadingRelationshipId,
  MemoryId,
} from '@grimoire/shared';
import { newId } from '@grimoire/shared';
import type {
  Work,
  ArchiveRecord,
  ReadingRelationship,
  AccessPath,
  Memory,
  ProgressEvent,
  ReadingAttempt,
  ReadingSession,
} from '../dist/index.js';
import {
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  createWork,
  ArchiveReason,
  createArchiveRecord,
  archiveWork,
  PersonalState,
  ReadingPriority,
  createReadingRelationship,
  AccessPathKind,
  AccessCapability,
  SourceHealth,
  createWebAccessPath,
  MemoryType,
  SpoilerLevel,
  createMemory,
  ProgressMethod,
  ProgressConfidence,
  createProgressEvent,
  createReadingAttempt,
  createReadingSession,
  findDuplicateCandidates,
  compareWorksForDuplicates,
  normalizeTitleForDeduplication,
  stripSubtitles,
  mergeWorksNonDestructive,
} from '../dist/index.js';

// ---------------------------------------------------------------------------
// Test Factories & Fixtures
// ---------------------------------------------------------------------------

function createTestWork(overrides: Partial<Parameters<typeof createWork>[0]> = {}): Work {
  return createWork({
    title: 'Test Work',
    alternativeTitles: [],
    aliases: [],
    description: 'A test work description',
    contentType: ContentType.Manga,
    origin: ContentOrigin.Japanese,
    publicationState: PublicationState.Ongoing,
    privacyState: PrivacyState.Public,
    coverRef: 'cover-1.jpg',
    externalIds: [],
    genres: ['Action', 'Fantasy'],
    tags: ['Adventure'],
    ...overrides,
  });
}

function createTestRelationship(
  workId: WorkId,
  overrides: Partial<Parameters<typeof createReadingRelationship>[0]> = {},
): ReadingRelationship {
  return createReadingRelationship({
    workId,
    personalState: PersonalState.Reading,
    priority: ReadingPriority.Normal,
    startedAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: '2026-01-15T00:00:00.000Z',
    completedAt: null,
    stoppedAt: null,
    stoppedReason: null,
    stoppedNote: null,
    currentAnchor: { type: 'chapter', chapter: 25 },
    preferredAccessPathId: null,
    ...overrides,
  });
}

function createTestWebPath(workId: WorkId, overrides: Partial<Parameters<typeof createWebAccessPath>[0]> = {}): AccessPath {
  return createWebAccessPath({
    workId,
    url: 'https://example.com/read/test-work',
    provider: 'ExampleProvider',
    label: 'Primary Reader',
    isPreferred: true,
    capabilities: [AccessCapability.Read],
    ...overrides,
  });
}

function createTestMemory(workId: WorkId, overrides: Partial<Parameters<typeof createMemory>[0]> = {}): Memory {
  return createMemory({
    workId,
    type: MemoryType.Note,
    title: 'Favorite panel',
    body: 'Great character introduction in chapter 12.',
    privacyState: PrivacyState.Public,
    spoilerLevel: SpoilerLevel.SpoilerFree,
    showInGlobalGallery: false,
    accessPathId: null,
    progressAnchor: { type: 'chapter', chapter: 12 },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Cycle 9: Archive System, Duplicate Detection, & Non-Destructive Merging', () => {

  // =========================================================================
  // 1. Archive System
  // =========================================================================
  describe('Archive System & Invariants', () => {
    it('supports nuanced archive reasons: Completed, Dropped, Abandoned, LostInterest, SourceDead', () => {
      const reasons = [
        ArchiveReason.Completed,
        ArchiveReason.Dropped,
        ArchiveReason.Abandoned,
        ArchiveReason.LostInterest,
        ArchiveReason.SourceDead,
      ];

      for (const reason of reasons) {
        const record = createArchiveRecord({
          workId: 'work-arch-test' as WorkId,
          reason,
          note: `Archived for reason: ${reason}`,
          previousState: PersonalState.Reading,
          previousProgress: { type: 'chapter', chapter: 50 },
        });

        assert.equal(record.reason, reason);
        assert.ok(record.id);
        assert.ok(record.archivedAt);
      }
    });

    it('preserves reading progress, access paths, and memories upon archiving (permanence principle)', () => {
      const work = createTestWork({ title: 'Permanence Series' });
      const relationship = createTestRelationship(work.id, {
        currentAnchor: { type: 'chapter', chapter: 88, subchapter: 5 },
        personalState: PersonalState.Reading,
      });
      const accessPath = createTestWebPath(work.id);
      const memory = createTestMemory(work.id);

      const archiveResult = archiveWork({
        work,
        relationship,
        accessPaths: [accessPath],
        memories: [memory],
        reason: ArchiveReason.Dropped,
        note: 'Pacing slowed down significantly in arc 4.',
        whyStopped: 'The story diverged from its original premise.',
        metadata: { dropChapter: 88.5, recommendedToOthers: false },
      });

      // 1. Work is soft-archived
      assert.ok(archiveResult.work.deletedAt, 'work.deletedAt should be set');
      assert.equal(archiveResult.work.id, work.id);

      // 2. Reading progress is strictly preserved and NOT wiped
      assert.ok(archiveResult.relationship, 'relationship should exist');
      assert.deepEqual(archiveResult.relationship.currentAnchor, {
        type: 'chapter',
        chapter: 88,
        subchapter: 5,
      });
      assert.equal(archiveResult.relationship.personalState, PersonalState.Dropped);
      assert.equal(archiveResult.relationship.stoppedReason, ArchiveReason.Dropped);
      assert.equal(archiveResult.relationship.stoppedNote, 'The story diverged from its original premise.');

      // 3. Access paths are intact
      assert.equal(archiveResult.accessPaths.length, 1);
      assert.equal(archiveResult.accessPaths[0].id, accessPath.id);
      assert.equal(archiveResult.accessPaths[0].workId, work.id);

      // 4. Memories are intact and augmented with WhyStopped reflection memory
      assert.ok(archiveResult.memories.length >= 2);
      assert.ok(archiveResult.memories.some((m) => m.id === memory.id));
      assert.ok(archiveResult.whyStoppedMemory);
      assert.equal(archiveResult.whyStoppedMemory?.type, MemoryType.WhyStopped);
      assert.equal(archiveResult.whyStoppedMemory?.body, 'The story diverged from its original premise.');

      // 5. ArchiveRecord contains full snapshot and metadata
      assert.equal(archiveResult.archiveRecord.workId, work.id);
      assert.equal(archiveResult.archiveRecord.reason, ArchiveReason.Dropped);
      assert.equal(archiveResult.archiveRecord.whyStopped, 'The story diverged from its original premise.');
      assert.deepEqual(archiveResult.archiveRecord.metadata, {
        dropChapter: 88.5,
        recommendedToOthers: false,
      });
      assert.deepEqual(archiveResult.archiveRecord.previousProgress, {
        type: 'chapter',
        chapter: 88,
        subchapter: 5,
      });
      assert.equal(archiveResult.archiveRecord.previousState, PersonalState.Reading);

      // 6. Domain event emitted
      assert.equal(archiveResult.event.type, 'work.archived');
      assert.equal(archiveResult.event.payload.workId, work.id);
      assert.equal(archiveResult.event.payload.reason, ArchiveReason.Dropped);
    });

    it('supports archiving without an existing reading relationship', () => {
      const work = createTestWork({ title: 'Unread Planned Series' });
      const archiveResult = archiveWork({
        work,
        reason: ArchiveReason.SourceDead,
        note: 'Publisher shutdown and site went offline.',
      });

      assert.ok(archiveResult.work.deletedAt);
      assert.equal(archiveResult.relationship, null);
      assert.equal(archiveResult.archiveRecord.reason, ArchiveReason.SourceDead);
      assert.equal(archiveResult.archiveRecord.previousProgress, null);
      assert.equal(archiveResult.archiveRecord.previousState, null);
    });

    it('sets PersonalState.Completed when archive reason is Completed', () => {
      const work = createTestWork({ title: 'Finished Classic' });
      const relationship = createTestRelationship(work.id, {
        personalState: PersonalState.Reading,
        currentAnchor: { type: 'chapter', chapter: 200 },
      });

      const archiveResult = archiveWork({
        work,
        relationship,
        reason: ArchiveReason.Completed,
        note: 'Masterpiece finale!',
      });

      assert.equal(archiveResult.relationship?.personalState, PersonalState.Completed);
      assert.ok(archiveResult.relationship?.completedAt);
    });
  });

  // =========================================================================
  // 2. Duplicate Candidate Detection Engine
  // =========================================================================
  describe('Duplicate Candidate Detection Engine (findDuplicateCandidates)', () => {
    describe('Normalization helpers', () => {
      it('normalizes titles with case, punctuation, articles, and diacritics', () => {
        assert.equal(
          normalizeTitleForDeduplication('The Beginning After The End!'),
          'beginning after end',
        );
        assert.equal(
          normalizeTitleForDeduplication('Sousou no Frieren (葬送のフリーレン)'),
          'sousou no frieren',
        );
        assert.equal(
          normalizeTitleForDeduplication('Steins;Gate & Steins;Gate 0'),
          'stein gate and stein gate 0',
        );
        assert.equal(
          normalizeTitleForDeduplication('Overlord II'),
          'overlord 2',
        );
      });

      it('strips subtitles and parenthetical format tags', () => {
        assert.equal(
          stripSubtitles('Solo Leveling - Season 2: Arise from the Shadow'),
          'Solo Leveling',
        );
        assert.equal(
          stripSubtitles("Omniscient Reader's Viewpoint (Webtoon)"),
          "Omniscient Reader's Viewpoint",
        );
        assert.equal(
          stripSubtitles('Tower of God [Official]'),
          'Tower of God',
        );
        assert.equal(
          stripSubtitles('Frieren: Beyond Journey’s End'),
          'Frieren',
        );
      });
    });

    describe('Candidate detection', () => {
      it('detects exact title match with 1.0 confidence', () => {
        const work1 = createTestWork({ title: 'Solo Leveling' });
        const work2 = createTestWork({ title: 'Solo Leveling' });

        const comparison = compareWorksForDuplicates(work1, work2);
        assert.equal(comparison.confidence, 1.0);
        assert.ok(comparison.isDuplicate);
        assert.ok(comparison.matchReasons.includes('Exact Title Match'));
      });

      it('detects normalized title match with punctuation and casing differences', () => {
        const work1 = createTestWork({ title: 'Tower of God' });
        const work2 = createTestWork({ title: 'tower of god!' });

        const comparison = compareWorksForDuplicates(work1, work2);
        assert.ok(comparison.confidence >= 0.95);
        assert.ok(comparison.matchReasons.includes('Normalized Title Match'));
      });

      it('detects match through subtitle and format stripping', () => {
        const work1 = createTestWork({ title: 'Overlord' });
        const work2 = createTestWork({ title: 'Overlord: The Undead King' });

        const comparison = compareWorksForDuplicates(work1, work2);
        assert.ok(comparison.confidence >= 0.90);
        assert.ok(comparison.matchReasons.includes('Normalized Title Match'));
      });

      it('detects shared external IDs (e.g. AniList, MAL)', () => {
        const work1 = createTestWork({
          title: 'A Story',
          externalIds: [{ provider: 'AniList', externalId: '105333' }],
        });
        const work2 = createTestWork({
          title: 'Different Local Title',
          externalIds: [{ provider: 'anilist', externalId: '105333' }],
        });

        const comparison = compareWorksForDuplicates(work1, work2);
        assert.equal(comparison.confidence, 1.0);
        assert.ok(comparison.matchReasons.includes('Shared External ID: anilist:105333'));
      });

      it('detects alternative title match and alias match', () => {
        const work1 = createTestWork({
          title: 'Attack on Titan',
          alternativeTitles: ['Shingeki no Kyojin'],
          aliases: ['AOT'],
        });
        const work2 = createTestWork({
          title: 'Shingeki no Kyojin',
          aliases: ['AOT'],
        });

        const comparison = compareWorksForDuplicates(work1, work2);
        assert.ok(comparison.confidence >= 0.90);
        assert.ok(comparison.matchReasons.includes('Alternative Title Match'));
        assert.ok(comparison.matchReasons.includes('Alias Match'));
      });

      it('scans a collection and finds duplicate pairs ranked by confidence', () => {
        const w1 = createTestWork({ title: 'Solo Leveling' });
        const w2 = createTestWork({ title: 'Solo Leveling (Webtoon)' });
        const w3 = createTestWork({
          title: 'Omniscient Reader',
          externalIds: [{ provider: 'mal', externalId: '9999' }],
        });
        const w4 = createTestWork({
          title: "Omniscient Reader's Viewpoint",
          externalIds: [{ provider: 'myanimelist', externalId: '9999' }],
        });
        const w5 = createTestWork({ title: 'Completely Unique Book' });

        const pairs = findDuplicateCandidates([w1, w2, w3, w4, w5]);

        assert.equal(pairs.length, 2);
        // External ID match has 1.0 confidence, should rank first
        assert.equal(pairs[0].confidence, 1.0);
        assert.ok(pairs[0].matchReasons.some((r) => r.startsWith('Shared External ID: mal:9999')));
        assert.ok(pairs[1].matchReasons.includes('Normalized Title Match'));
      });

      it('supports finding duplicates against a single target work', () => {
        const target = createTestWork({
          title: 'The Breaker',
          aliases: ['Breaker'],
        });
        const pool = [
          createTestWork({ title: 'The Breaker: New Waves' }),
          createTestWork({ title: 'Breaker', aliases: ['The Breaker'] }),
          createTestWork({ title: 'Naruto' }),
        ];

        const pairs = findDuplicateCandidates(target, pool);
        assert.ok(pairs.length >= 1);
        assert.equal(pairs[0].workA.id, target.id);
        assert.ok(pairs[0].matchReasons.includes('Alias Match') || pairs[0].matchReasons.includes('Normalized Title Match'));
      });
    });
  });

  // =========================================================================
  // 3. Non-Destructive Merge Engine
  // =========================================================================
  describe('Non-Destructive Merge Engine (mergeWorksNonDestructive)', () => {
    it('retains target work identity while combining aliases, alt titles, tags, and genres without duplicates', () => {
      const targetWork = createTestWork({
        title: 'Solo Leveling',
        aliases: ['SL'],
        alternativeTitles: ['Na Honjaman Level Up'],
        genres: ['Action', 'Fantasy'],
        tags: ['Dungeons', 'Hunters'],
        externalIds: [{ provider: 'anilist', externalId: '105333' }],
      });

      const secondaryWork = createTestWork({
        title: 'Only I Level Up',
        aliases: ['SL', 'Solo Leveling'],
        alternativeTitles: ['Na Honjaman Level Up', 'I Alone Level Up'],
        genres: ['Fantasy', 'Supernatural'],
        tags: ['Hunters', 'System', 'Reawakening'],
        externalIds: [
          { provider: 'anilist', externalId: '105333' },
          { provider: 'mal', externalId: '121496' },
        ],
      });

      const result = mergeWorksNonDestructive({
        targetWork,
        secondaryWork,
        progressPolicy: 'keep_target',
      });

      // 1. Identity strictly retained
      assert.equal(result.mergedWork.id, targetWork.id);
      assert.equal(result.mergedWork.createdAt, targetWork.createdAt);
      assert.equal(result.mergedWork.title, 'Solo Leveling');

      // 2. Aliases combined without duplicates
      assert.deepEqual(result.mergedWork.aliases, ['SL', 'Solo Leveling']);

      // 3. Alt titles combined without duplicates, including secondary title
      assert.ok(result.mergedWork.alternativeTitles.includes('Na Honjaman Level Up'));
      assert.ok(result.mergedWork.alternativeTitles.includes('Only I Level Up'));
      assert.ok(result.mergedWork.alternativeTitles.includes('I Alone Level Up'));

      // 4. Genres and tags combined without duplicates
      assert.deepEqual(result.mergedWork.genres, ['Action', 'Fantasy', 'Supernatural']);
      assert.deepEqual(result.mergedWork.tags, ['Dungeons', 'Hunters', 'System', 'Reawakening']);

      // 5. External IDs combined without duplicates
      assert.equal(result.mergedWork.externalIds.length, 2);
      assert.ok(result.mergedWork.externalIds.some((e) => e.provider.toLowerCase() === 'anilist' && e.externalId === '105333'));
      assert.ok(result.mergedWork.externalIds.some((e) => e.provider.toLowerCase() === 'mal' && e.externalId === '121496'));

      // 6. Secondary work soft-archived with mergedIntoWorkId
      assert.ok(result.archivedSecondaryWork.deletedAt);
      assert.equal(result.archivedSecondaryWork.mergedIntoWorkId, targetWork.id);

      // 7. Archive record created
      assert.equal(result.archiveRecord.workId, secondaryWork.id);
      assert.equal(result.archiveRecord.reason, ArchiveReason.Merged);
      assert.equal(result.archiveRecord.mergedIntoWorkId, targetWork.id);

      // 8. Event emitted
      assert.equal(result.event.type, 'work.merged');
      assert.equal(result.event.payload.sourceId, secondaryWork.id);
      assert.equal(result.event.payload.targetId, targetWork.id);
    });

    it('re-points all access paths, memories, and reading history to target work', () => {
      const targetWork = createTestWork({ title: 'Target Work' });
      const secondaryWork = createTestWork({ title: 'Secondary Work' });

      const targetPath = createTestWebPath(targetWork.id, {
        label: 'Target Web Source',
        isPreferred: true,
      });
      const secondaryPath = createTestWebPath(secondaryWork.id, {
        label: 'Secondary Web Source',
        isPreferred: true, // Should be demoted since target already has preferred
      });

      const targetMemory = createTestMemory(targetWork.id, { title: 'Target Note' });
      const secondaryMemory = createTestMemory(secondaryWork.id, { title: 'Secondary Note' });

      const targetRel = createTestRelationship(targetWork.id);
      const secondaryRel = createTestRelationship(secondaryWork.id);

      const secondaryProgressEvent = createProgressEvent({
        workId: secondaryWork.id,
        readingRelationshipId: secondaryRel.id,
        method: ProgressMethod.Reader,
        confidence: ProgressConfidence.Confirmed,
        anchorAfter: { type: 'chapter', chapter: 30 },
      });

      const secondaryAttempt = createReadingAttempt({
        workId: secondaryWork.id,
        readingRelationshipId: secondaryRel.id,
        attemptNumber: 1,
        startedAt: '2026-02-01T00:00:00.000Z',
        endedAt: null,
        finalAnchor: null,
        notes: 'First read attempt on secondary',
      });

      const secondarySession = createReadingSession({
        workId: secondaryWork.id,
        readingRelationshipId: secondaryRel.id,
        accessPathId: secondaryPath.id,
        startedAt: '2026-02-01T10:00:00.000Z',
        endedAt: '2026-02-01T11:00:00.000Z',
        durationSeconds: 3600,
        anchorBefore: { type: 'chapter', chapter: 20 },
        anchorAfter: { type: 'chapter', chapter: 30 },
      });

      const result = mergeWorksNonDestructive({
        targetWork,
        secondaryWork,
        targetRelationship: targetRel,
        secondaryRelationship: secondaryRel,
        accessPaths: [targetPath, secondaryPath],
        memories: [targetMemory, secondaryMemory],
        progressHistory: [secondaryProgressEvent],
        readingAttempts: [secondaryAttempt],
        readingSessions: [secondarySession],
        progressPolicy: 'keep_target',
      });

      // Access Paths
      assert.equal(result.rePointedAccessPaths.length, 2);
      assert.ok(result.rePointedAccessPaths.every((p) => p.workId === targetWork.id));
      const rePointedSecPath = result.rePointedAccessPaths.find((p) => p.id === secondaryPath.id);
      assert.equal(rePointedSecPath?.isPreferred, false, 'secondary isPreferred should be demoted');

      // Memories
      assert.equal(result.rePointedMemories.length, 2);
      assert.ok(result.rePointedMemories.every((m) => m.workId === targetWork.id));

      // Reading History
      assert.equal(result.rePointedProgressEvents.length, 1);
      assert.equal(result.rePointedProgressEvents[0].workId, targetWork.id);
      assert.equal(result.rePointedProgressEvents[0].readingRelationshipId, targetRel.id);

      // Attempts & Sessions
      assert.equal(result.rePointedReadingAttempts.length, 1);
      assert.equal(result.rePointedReadingAttempts[0].workId, targetWork.id);
      assert.equal(result.rePointedReadingAttempts[0].readingRelationshipId, targetRel.id);

      assert.equal(result.rePointedReadingSessions.length, 1);
      assert.equal(result.rePointedReadingSessions[0].workId, targetWork.id);
      assert.equal(result.rePointedReadingSessions[0].readingRelationshipId, targetRel.id);
    });

    describe('Progress resolution policies', () => {
      it('resolves with keep_target policy', () => {
        const targetWork = createTestWork({ title: 'Target' });
        const secondaryWork = createTestWork({ title: 'Secondary' });

        const targetRel = createTestRelationship(targetWork.id, {
          currentAnchor: { type: 'chapter', chapter: 10 },
        });
        const secondaryRel = createTestRelationship(secondaryWork.id, {
          currentAnchor: { type: 'chapter', chapter: 80 },
        });

        const result = mergeWorksNonDestructive({
          targetWork,
          secondaryWork,
          targetRelationship: targetRel,
          secondaryRelationship: secondaryRel,
          progressPolicy: 'keep_target',
        });

        assert.deepEqual(result.resolvedRelationship?.currentAnchor, {
          type: 'chapter',
          chapter: 10,
        });
      });

      it('resolves with keep_secondary policy', () => {
        const targetWork = createTestWork({ title: 'Target' });
        const secondaryWork = createTestWork({ title: 'Secondary' });

        const targetRel = createTestRelationship(targetWork.id, {
          currentAnchor: { type: 'chapter', chapter: 10 },
        });
        const secondaryRel = createTestRelationship(secondaryWork.id, {
          currentAnchor: { type: 'chapter', chapter: 80 },
        });

        const result = mergeWorksNonDestructive({
          targetWork,
          secondaryWork,
          targetRelationship: targetRel,
          secondaryRelationship: secondaryRel,
          progressPolicy: 'keep_secondary',
        });

        assert.deepEqual(result.resolvedRelationship?.currentAnchor, {
          type: 'chapter',
          chapter: 80,
        });
      });

      it('resolves with highest_progress policy', () => {
        const targetWork = createTestWork({ title: 'Target' });
        const secondaryWork = createTestWork({ title: 'Secondary' });

        // Secondary has higher progress
        const targetRel1 = createTestRelationship(targetWork.id, {
          currentAnchor: { type: 'chapter', chapter: 25 },
        });
        const secondaryRel1 = createTestRelationship(secondaryWork.id, {
          currentAnchor: { type: 'chapter', chapter: 110 },
        });

        const result1 = mergeWorksNonDestructive({
          targetWork,
          secondaryWork,
          targetRelationship: targetRel1,
          secondaryRelationship: secondaryRel1,
          progressPolicy: 'highest_progress',
        });

        assert.deepEqual(result1.resolvedRelationship?.currentAnchor, {
          type: 'chapter',
          chapter: 110,
        });

        // Target has higher progress
        const targetRel2 = createTestRelationship(targetWork.id, {
          currentAnchor: { type: 'chapter', chapter: 150 },
        });
        const secondaryRel2 = createTestRelationship(secondaryWork.id, {
          currentAnchor: { type: 'chapter', chapter: 50 },
        });

        const result2 = mergeWorksNonDestructive({
          targetWork,
          secondaryWork,
          targetRelationship: targetRel2,
          secondaryRelationship: secondaryRel2,
          progressPolicy: 'highest_progress',
        });

        assert.deepEqual(result2.resolvedRelationship?.currentAnchor, {
          type: 'chapter',
          chapter: 150,
        });
      });

      it('resolves with most_recent policy', () => {
        const targetWork = createTestWork({ title: 'Target' });
        const secondaryWork = createTestWork({ title: 'Secondary' });

        const targetRel = createTestRelationship(targetWork.id, {
          currentAnchor: { type: 'chapter', chapter: 50 },
          lastActiveAt: '2026-01-10T12:00:00.000Z',
        });
        const secondaryRel = createTestRelationship(secondaryWork.id, {
          currentAnchor: { type: 'chapter', chapter: 45 },
          lastActiveAt: '2026-03-20T15:00:00.000Z', // More recent
        });

        const result = mergeWorksNonDestructive({
          targetWork,
          secondaryWork,
          targetRelationship: targetRel,
          secondaryRelationship: secondaryRel,
          progressPolicy: 'most_recent',
        });

        assert.deepEqual(result.resolvedRelationship?.currentAnchor, {
          type: 'chapter',
          chapter: 45,
        });
        assert.equal(result.resolvedRelationship?.lastActiveAt, '2026-03-20T15:00:00.000Z');
      });
    });

    it('rejects self-merge attempt with domain invariant error', () => {
      const work = createTestWork({ title: 'Self Work' });
      assert.throws(
        () =>
          mergeWorksNonDestructive({
            targetWork: work,
            secondaryWork: work,
            progressPolicy: 'keep_target',
          }),
        /cannot merge a work into itself/i,
      );
    });
  });
});
