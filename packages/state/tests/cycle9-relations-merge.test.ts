import { describe, it, expect, beforeEach } from 'vitest';
import {
  clientRepository,
  useWorkDetailStore,
  useWorkRelationsStore,
  useMergeWizardStore,
  useLibraryStore,
} from '../src';
import {
  ArchiveReason,
  ContentType,
  PersonalState,
  RelationType,
  WorkRelationType,
} from '@grimoire/domain';
import { WorkId } from '@grimoire/shared';

describe('Cycle 9: Archive, Duplicate Merging & Work Relations', () => {
  beforeEach(() => {
    useLibraryStore.getState().resetFilters();
  });

  describe('Archive Operations', () => {
    it('archives a work with nuanced reason and reflection note, preserving snapshot', () => {
      // Create a test work
      const testItem = clientRepository.createWork(
        {
          title: 'Archive Test Novel',
          description: 'A story that gets put on hiatus',
          contentType: ContentType.WebNovel,
          origin: 'korean' as any,
          publicationState: 'ongoing' as any,
          privacyState: 'public' as any,
          coverRef: null,
          alternativeTitles: [],
          aliases: [],
          externalIds: [],
          genres: ['Fantasy'],
          tags: ['Magic'],
        },
        PersonalState.Reading,
        { type: 'chapter', chapter: 45, title: 'Chapter 45' },
      );

      const workId = testItem.work.id;

      // Archive via store action
      const record = useWorkDetailStore
        .getState()
        .archiveWork(workId, ArchiveReason.WaitingIndefinitely, 'Paused due to author hiatus');

      expect(record).toBeDefined();
      expect(record?.workId).toBe(workId);
      expect(record?.reason).toBe(ArchiveReason.WaitingIndefinitely);
      expect(record?.note).toBe('Paused due to author hiatus');
      expect(record?.previousProgress).toEqual({
        type: 'chapter',
        chapter: 45,
        title: 'Chapter 45',
      });
      expect(record?.previousState).toBe(PersonalState.Reading);

      // Verify work is marked deletedAt
      const itemAfter = clientRepository.getItem(workId);
      expect(itemAfter?.work.deletedAt).toBeTruthy();
      expect(itemAfter?.relationship?.stoppedReason).toBe(ArchiveReason.WaitingIndefinitely);
      expect(itemAfter?.relationship?.stoppedNote).toBe('Paused due to author hiatus');

      // Verify excluded from active library summaries
      const summaries = clientRepository.getSummaries();
      expect(summaries.some((s) => s.id === workId)).toBe(false);

      // Verify present in archived works query
      const archived = clientRepository.getArchivedWorks();
      expect(archived.some((a) => a.work.id === workId)).toBe(true);

      // Verify restore
      clientRepository.restoreWork(workId);
      expect(clientRepository.getItem(workId)?.work.deletedAt).toBeNull();
      expect(clientRepository.getSummaries().some((s) => s.id === workId)).toBe(true);
    });
  });

  describe('Duplicate Detection', () => {
    it('detects duplicate candidates by exact and similar titles and aliases', () => {
      // Create primary work
      const primary = clientRepository.createWork({
        title: 'Solo Leveling Ragnarok',
        description: 'Sequel spin-off story',
        contentType: ContentType.WebNovel,
        origin: 'korean' as any,
        publicationState: 'ongoing' as any,
        privacyState: 'public' as any,
        coverRef: null,
        alternativeTitles: ['SL Ragnarok'],
        aliases: ['Ragnarok'],
        externalIds: [{ provider: 'kakaopage', externalId: '998877' }],
        genres: ['Action'],
        tags: ['Hunters'],
      });

      // Create duplicate candidate with matching alias and similar title
      const duplicate = clientRepository.createWork({
        title: 'Solo Leveling - Ragnarok',
        description: 'Duplicate entry',
        contentType: ContentType.Manhwa,
        origin: 'korean' as any,
        publicationState: 'ongoing' as any,
        privacyState: 'public' as any,
        coverRef: null,
        alternativeTitles: [],
        aliases: ['SL Ragnarok'],
        externalIds: [{ provider: 'kakaopage', externalId: '998877' }],
        genres: ['Action'],
        tags: ['Monsters'],
      });

      const candidates = useWorkDetailStore.getState().findDuplicates(primary.work.id);

      expect(candidates.length).toBeGreaterThan(0);
      const match = candidates.find((c) => c.work.id === duplicate.work.id);
      expect(match).toBeDefined();
      expect(match!.confidence).toBeGreaterThanOrEqual(0.85);
      expect(match!.matchedFields.length).toBeGreaterThan(0);
    });
  });

  describe('Execute Merge', () => {
    it('non-destructively merges secondary work into target work with progress resolution', () => {
      // Target work
      const target = clientRepository.createWork(
        {
          title: 'Tower of God (Official)',
          description: 'Official webtoon release',
          contentType: ContentType.Manhwa,
          origin: 'korean' as any,
          publicationState: 'ongoing' as any,
          privacyState: 'public' as any,
          coverRef: null,
          alternativeTitles: ['TOG'],
          aliases: ['Tower of God'],
          externalIds: [{ provider: 'naver', externalId: '183816' }],
          genres: ['Fantasy'],
          tags: ['Regulars'],
        },
        PersonalState.Reading,
        { type: 'chapter', chapter: 100, title: 'Chapter 100' },
        { provider: 'webtoons', url: 'https://www.webtoons.com/en/fantasy/tower-of-god/viewer?title_no=95', label: 'Webtoons Official' },
      );

      // Secondary duplicate work with higher progress and additional source & memory
      const secondary = clientRepository.createWork(
        {
          title: 'Tower of God (Fan Scan)',
          description: 'Early scanlation translation',
          contentType: ContentType.Manhwa,
          origin: 'korean' as any,
          publicationState: 'ongoing' as any,
          privacyState: 'public' as any,
          coverRef: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
          alternativeTitles: ['Sin-ui Tap'],
          aliases: ['Baam Journey'],
          externalIds: [{ provider: 'mangadex', externalId: 'c0ee660b' }],
          genres: ['Action', 'Mystery'],
          tags: ['Tower', 'Rankers'],
        },
        PersonalState.Reading,
        { type: 'chapter', chapter: 150, title: 'Chapter 150' },
        { provider: 'mangadex', url: 'https://mangadex.org/title/c0ee660b', label: 'MangaDex Scan' },
      );

      // Add memory to secondary
      clientRepository.addMemory(secondary.work.id, {
        type: 'quote' as any,
        title: 'Rachel betrayal quote',
        body: 'What do you desire? Money and wealth? Honor and pride? Authority and power?',
        privacyState: 'public' as any,
        spoilerLevel: 'spoiler_free' as any,
        showInGlobalGallery: true,
      });

      const initialTargetPaths = target.accessPaths.length;

      // Execute merge picking furthest progress
      const merged = useWorkDetailStore.getState().executeMerge(target.work.id, secondary.work.id, {
        progressChoice: 'highest',
        whyMergedNote: 'Consolidated fan scan into official edition',
      });

      expect(merged.id).toBe(target.work.id);

      const targetAfter = clientRepository.getItem(target.work.id)!;
      // 1. Sources combined
      expect(targetAfter.accessPaths.length).toBeGreaterThan(initialTargetPaths);
      expect(targetAfter.accessPaths.some((p) => p.label === 'MangaDex Scan')).toBe(true);

      // 2. Memories combined
      expect(targetAfter.memories.some((m) => m.title === 'Rachel betrayal quote')).toBe(true);

      // 3. Furthest progress preserved
      expect(targetAfter.relationship?.currentAnchor).toEqual({
        type: 'chapter',
        chapter: 150,
        title: 'Chapter 150',
      });

      // 4. Aliases and genres merged
      expect(targetAfter.work.aliases).toContain('Baam Journey');
      expect(targetAfter.work.genres).toContain('Mystery');
      expect(targetAfter.work.tags).toContain('Rankers');

      // 5. Secondary archived as duplicate
      const secAfter = clientRepository.getItem(secondary.work.id)!;
      expect(secAfter.work.deletedAt).toBeTruthy();
    });
  });

  describe('Work Relations & Adaptation Graph', () => {
    it('creates, lists, and unlinks work relations with invariants', () => {
      const source = clientRepository.getItems()[0]!.work;
      const target = clientRepository.getItems()[1]!.work;

      // Invariant: cannot relate work to itself
      expect(() =>
        useWorkDetailStore
          .getState()
          .linkWorkRelation(source.id, source.id, RelationType.AdaptationOf),
      ).toThrow('work cannot be related to itself');

      // Link relation
      const relation = useWorkDetailStore
        .getState()
        .linkWorkRelation(
          source.id,
          target.id,
          RelationType.AdaptationOf,
          'Manga adaptation of original novel',
        );

      expect(relation).toBeDefined();
      expect(relation?.sourceWorkId).toBe(source.id);
      expect(relation?.targetWorkId).toBe(target.id);
      expect(relation?.relationType).toBe(WorkRelationType.AdaptationOf);
      expect(relation?.notes).toBe('Manga adaptation of original novel');

      // Query relations via store
      const relations = clientRepository.getWorkRelations(source.id);
      expect(relations.some((r) => r.id === relation!.id)).toBe(true);

      // Remove relation
      useWorkDetailStore.getState().removeWorkRelation(relation!.id);
      const relationsAfter = clientRepository.getWorkRelations(source.id);
      expect(relationsAfter.some((r) => r.id === relation!.id)).toBe(false);
    });

    it('works correctly via useWorkRelationsStore and useMergeWizardStore', () => {
      const works = clientRepository.getItems();
      const w1 = works[0]!.work.id;
      const w2 = works[1]!.work.id;

      // useWorkRelationsStore
      const rel = useWorkRelationsStore
        .getState()
        .linkWorkRelation(w1, w2, RelationType.Sequel, 'Part 2 sequel');
      expect(rel.relationType).toBe(WorkRelationType.Sequel);

      useWorkRelationsStore.getState().loadRelations(w1);
      expect(useWorkRelationsStore.getState().relations.some((r) => r.id === rel.id)).toBe(true);

      useWorkRelationsStore.getState().removeWorkRelation(rel.id);
      expect(useWorkRelationsStore.getState().relations.some((r) => r.id === rel.id)).toBe(false);

      // useMergeWizardStore
      useMergeWizardStore.getState().openWizard(w1);
      expect(useMergeWizardStore.getState().isOpen).toBe(true);
      expect(useMergeWizardStore.getState().targetWorkId).toBe(w1);
      useMergeWizardStore.getState().closeWizard();
      expect(useMergeWizardStore.getState().isOpen).toBe(false);
    });
  });
});
