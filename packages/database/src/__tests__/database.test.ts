import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import {
  createDatabase,
  closeDatabase,
  runMigrations,
  WorkRepositoryImpl,
  ReadingRepositoryImpl,
  AccessPathRepositoryImpl,
  MemoryRepositoryImpl,
  CaptureRepositoryImpl,
  SearchRepositoryImpl,
  UpdateRepositoryImpl,
  seedDatabase,
  smallSeedConfig,
  mediumSeedConfig,
} from '../index.js';
import {
  newId,
  type WorkId,
  type Work,
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  PersonalState,
  ReadingPriority,
  AccessPathKind,
  SourceHealth,
  type ProgressAnchor,
  MemoryType,
  SpoilerLevel,
  CaptureState,
  CaptureSource,
  UpdateCertainty,
  ArchiveReason,
} from '@grimoire/domain';

describe('Database Layer & Repositories', () => {
  let db: Database.Database;
  let workRepo: WorkRepositoryImpl;
  let readingRepo: ReadingRepositoryImpl;
  let accessPathRepo: AccessPathRepositoryImpl;
  let memoryRepo: MemoryRepositoryImpl;
  let captureRepo: CaptureRepositoryImpl;
  let searchRepo: SearchRepositoryImpl;
  let updateRepo: UpdateRepositoryImpl;

  beforeEach(() => {
    db = createDatabase({
      filename: ':memory:',
      runMigrations: true,
    });
    workRepo = new WorkRepositoryImpl(db);
    readingRepo = new ReadingRepositoryImpl(db);
    accessPathRepo = new AccessPathRepositoryImpl(db);
    memoryRepo = new MemoryRepositoryImpl(db);
    captureRepo = new CaptureRepositoryImpl(db);
    searchRepo = new SearchRepositoryImpl(db);
    updateRepo = new UpdateRepositoryImpl(db);
  });

  afterEach(() => {
    closeDatabase();
    try {
      db.close();
    } catch {
      // ignore if already closed
    }
  });

  describe('Connection & Pragmas', () => {
    it('enables WAL mode, foreign keys, and busy timeout', () => {
      const fk = db.pragma('foreign_keys', { simple: true });
      expect(fk).toBe(1);
    });

    it('applied all migrations', () => {
      const rows = db.prepare('SELECT name FROM schema_migrations ORDER BY id').all() as Array<{ name: string }>;
      const names = rows.map((r) => r.name);
      expect(names).toContain('0001_initial');
      expect(names).toContain('0001_indexes');
      expect(names).toContain('0002_app_settings');
    });

    it('seeded default app settings', () => {
      const theme = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('app.theme') as { value: string };
      expect(theme.value).toBe('"system"');
    });
  });

  describe('WorkRepositoryImpl', () => {
    it('creates, retrieves by ID, and indexes in FTS', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      const work: Work = {
        id: workId,
        title: 'Solo Leveling: Shadow Monarch',
        description: 'E-rank hunter Sung Jin-woo becomes the strongest.',
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: 'cover.jpg',
        alternativeTitles: ['Na Honjaman Rebeleop'],
        aliases: ['SL'],
        externalIds: [{ provider: 'anilist', externalId: '105398' }],
        genres: ['Action', 'Fantasy'],
        tags: ['Dungeon', 'Overpowered MC'],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      await workRepo.create(work);

      const retrieved = await workRepo.getById(workId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Solo Leveling: Shadow Monarch');
      expect(retrieved?.alternativeTitles).toContain('Na Honjaman Rebeleop');
      expect(retrieved?.aliases).toContain('SL');
      expect(retrieved?.genres).toEqual(['Action', 'Fantasy']);
      expect(retrieved?.tags).toEqual(['Dungeon', 'Overpowered MC']);
      expect(retrieved?.externalIds).toHaveLength(1);

      // Verify FTS search
      const searchRes = await workRepo.search({ query: 'Sung Jin-woo' });
      expect(searchRes.length).toBeGreaterThan(0);
      expect(searchRes[0]?.work.title).toBe('Solo Leveling: Shadow Monarch');
    });

    it('finds duplicates by external ID or title', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      await workRepo.create({
        id: workId,
        title: 'Tower of God',
        description: 'Reach the top of the tower.',
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: ['Sin-ui Tap'],
        aliases: ['ToG'],
        externalIds: [{ provider: 'webtoons', externalId: 'tog-01' }],
        genres: ['Fantasy'],
        tags: ['Tower'],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const dupesByExt = await workRepo.findDuplicates({
        externalIds: [{ provider: 'webtoons', externalId: 'tog-01' }],
      });
      expect(dupesByExt).toHaveLength(1);
      expect(dupesByExt[0]?.work.title).toBe('Tower of God');

      const dupesByTitle = await workRepo.findDuplicates({
        title: 'tower of god',
      });
      expect(dupesByTitle).toHaveLength(1);
    });

    it('archives and restores works properly', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      await workRepo.create({
        id: workId,
        title: 'Archived Story',
        description: 'Test archive',
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Cancelled,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: [],
        externalIds: [],
        genres: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      await workRepo.archive(workId, ArchiveReason.Dropped, 'Lost interest');

      const archived = await workRepo.getById(workId);
      expect(archived?.deletedAt).not.toBeNull();

      // Ensure excluded from default list
      const list = await workRepo.list({ includeDeleted: false });
      expect(list.items.some((w) => w.id === workId)).toBe(false);

      // Restore
      await workRepo.restore(workId);
      const restored = await workRepo.getById(workId);
      expect(restored?.deletedAt).toBeNull();
    });
  });

  describe('ReadingRepositoryImpl', () => {
    it('manages reading relationships, attempts, sessions, and progress events', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      await workRepo.create({
        id: workId,
        title: 'Omniscient Reader',
        description: 'Only I know the end of this world.',
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: ['ORV'],
        externalIds: [],
        genres: ['Action'],
        tags: ['Regression'],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const rel = await readingRepo.upsertRelationship({
        id: newId() as any,
        workId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: now,
        lastActiveAt: now,
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: 'chapter', chapter: 15, title: 'Chapter 15' } as any,
        preferredAccessPathId: null,
        createdAt: now,
        updatedAt: now,
      });

      expect(rel.personalState).toBe(PersonalState.Reading);
      expect(rel.priority).toBe(ReadingPriority.High);
      expect(rel.currentAnchor?.chapter).toBe(15);

      // Record a reading session
      const sessionId = newId() as any;
      const later = new Date(Date.now() + 1000).toISOString();
      await readingRepo.recordSession({
        id: sessionId,
        workId,
        readingRelationshipId: rel.id,
        accessPathId: null,
        startedAt: now,
        endedAt: later,
        durationSeconds: 1800,
        anchorBefore: { type: 'chapter', chapter: 15 } as any,
        anchorAfter: { type: 'chapter', chapter: 18 } as any,
        createdAt: later,
      });

      const sessions = await readingRepo.getSessions(workId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.durationSeconds).toBe(1800);

      const history = await readingRepo.getProgressHistory(workId);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect((history[0]?.anchorAfter as any).chapter).toBe(18);
    });
  });

  describe('AccessPathRepositoryImpl', () => {
    it('manages access paths, capabilities, and health status', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      await workRepo.create({
        id: workId,
        title: 'Frieren: Beyond Journey\'s End',
        description: 'The journey ends, a new one begins.',
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: [],
        externalIds: [],
        genres: ['Fantasy'],
        tags: ['Elf', 'Magic'],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const pathId = newId() as any;
      await accessPathRepo.add({
        id: pathId,
        workId,
        kind: AccessPathKind.Web,
        provider: 'MangaDex',
        label: 'Official MangaDex scan',
        url: 'https://mangadex.org/title/frieren',
        fileId: null,
        isPreferred: true,
        health: SourceHealth.Healthy,
        healthState: SourceHealth.Healthy,
        capabilities: ['read' as any, 'tracking' as any],
        lastCheckedAt: now,
        lastOpenedAt: now,
        provenance: { source: 'web' },
        createdAt: now,
        updatedAt: now,
      });

      const path = await accessPathRepo.getById(pathId);
      expect(path).not.toBeNull();
      expect(path?.kind).toBe(AccessPathKind.Web);
      expect(path?.isPreferred).toBe(true);

      // Update health
      await accessPathRepo.updateHealth(pathId, SourceHealth.Degraded, 'Cloudflare rate limit');
      const updated = await accessPathRepo.getById(pathId);
      expect(updated?.healthState).toBe(SourceHealth.Degraded);

      const events = await accessPathRepo.getHealthEvents(pathId);
      expect(events).toHaveLength(1);
      expect(events[0]?.errorMessage).toBe('Cloudflare rate limit');
    });
  });

  describe('MemoryRepositoryImpl', () => {
    it('creates memories with assets and tags, supports gallery filtering', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      await workRepo.create({
        id: workId,
        title: 'Chainsaw Man',
        description: 'Denji Devil Hunter',
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: ['CSM'],
        externalIds: [],
        genres: ['Action', 'Horror'],
        tags: ['Devils'],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const memId = newId() as any;
      await memoryRepo.create({
        id: memId,
        workId,
        type: MemoryType.Quote,
        title: 'Makima speech',
        body: 'A corpse is talking.',
        privacyState: 'normal' as any,
        spoilerLevel: SpoilerLevel.Minor,
        showInGlobalGallery: true,
        accessPathId: null,
        progressAnchor: { type: 'chapter', chapter: 28 } as any,
        tags: ['iconic', 'makima'],
        createdAt: now,
        updatedAt: now,
      });

      const retrieved = await memoryRepo.getById(memId);
      expect(retrieved?.title).toBe('Makima speech');
      expect(retrieved?.tags).toContain('iconic');

      const gallery = await memoryRepo.listGlobal({ onlyGallery: true });
      expect(gallery.some((m) => m.id === memId)).toBe(true);
    });
  });

  describe('CaptureRepositoryImpl', () => {
    it('creates batches and manages capture items and state transitions', async () => {
      const batchId = newId() as any;
      const now = new Date().toISOString();
      await captureRepo.createBatch({
        id: batchId,
        label: 'Evening Browser Session',
        source: CaptureSource.BrowserTabs,
        itemCount: 0,
        processedCount: 0,
        createdAt: now,
      });

      const capId = newId() as any;
      await captureRepo.addItems(batchId, [
        {
          id: capId,
          batchId,
          url: 'https://mangadex.org/chapter/12345/1',
          normalizedUrl: 'https://mangadex.org/chapter/12345/1',
          title: 'One Piece - Chapter 1100',
          faviconRef: null,
          browser: 'Firefox',
          windowLabel: 'Main Window',
          capturedAt: now,
          possibleWorkId: null,
          confidenceScore: 0.9,
          state: CaptureState.Pending,
          createdAt: now,
        },
      ]);

      const pending = await captureRepo.listPending();
      expect(pending.some((c) => c.id === capId)).toBe(true);

      // Process capture
      await captureRepo.updateState(capId, CaptureState.Matched);
      const batch = await captureRepo.getBatch(batchId);
      expect(batch?.processedCount).toBe(1);
    });
  });

  describe('SearchRepositoryImpl (FTS5)', () => {
    it('executes full-text queries across scopes with snippet generation', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      await workRepo.create({
        id: workId,
        title: 'The Apothecary Diaries',
        description: 'Maomao solves poison mysteries in the imperial court.',
        contentType: ContentType.LightNovel,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: ['Kusuriya no Hitorigoto'],
        aliases: [],
        externalIds: [],
        genres: ['Mystery', 'Historical'],
        tags: ['Medicine', 'Court Intrigue'],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const searchResults = await searchRepo.search('poison mysteries', ['works']);
      expect(searchResults.matches.length).toBeGreaterThan(0);
      expect(searchResults.matches[0]?.title).toBe('The Apothecary Diaries');
      expect(searchResults.matches[0]?.snippet).toBeDefined();
    });
  });

  describe('UpdateRepositoryImpl', () => {
    it('records and queries newly detected work releases', async () => {
      const workId = newId() as WorkId;
      const now = new Date().toISOString();
      await workRepo.create({
        id: workId,
        title: 'Kingdom',
        description: 'Qin dynasty war epic.',
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: [],
        externalIds: [],
        genres: ['Historical', 'Action'],
        tags: ['Warfare'],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      await updateRepo.addUpdates([
        {
          workId,
          label: 'Chapter 780 - Battle of Hango',
          certainty: UpdateCertainty.Confirmed,
          numericIndex: 780,
          sourceUrl: 'https://mangadex.org/chapter/kingdom-780',
          detectedAt: now,
        },
      ]);

      const updates = await updateRepo.getUpdatesByWork(workId);
      expect(updates).toHaveLength(1);
      expect(updates[0]?.numericIndex).toBe(780);
    });
  });

  describe('Seed Datasets (Small & Medium)', () => {
    it('generates small dataset (50 works) with all relationships', () => {
      const stats = seedDatabase(db, smallSeedConfig);
      expect(stats.worksCreated).toBe(50);
      expect(stats.readingRelationshipsCreated).toBe(50);
      expect(stats.memoriesCreated).toBe(30);
      expect(stats.capturesCreated).toBe(15);
      expect(stats.updatesCreated).toBe(15);

      const count = db.prepare('SELECT COUNT(*) as count FROM works').get() as { count: number };
      expect(count.count).toBe(50);
    });

    it('generates medium benchmark dataset (500 works) with exact distributions', () => {
      // Clear in-memory db tables first
      db.prepare('DELETE FROM update_entries').run();
      db.prepare('DELETE FROM captures').run();
      db.prepare('DELETE FROM capture_batches').run();
      db.prepare('DELETE FROM memories').run();
      db.prepare('DELETE FROM access_paths').run();
      db.prepare('DELETE FROM reading_relationships').run();
      db.prepare('DELETE FROM works').run();
      db.prepare('DELETE FROM search_fts').run();

      const stats = seedDatabase(db, mediumSeedConfig);
      expect(stats.worksCreated).toBe(500);
      expect(stats.readingRelationshipsCreated).toBe(500);
      expect(stats.memoriesCreated).toBe(300);
      expect(stats.capturesCreated).toBe(100);
      expect(stats.updatesCreated).toBe(100);

      // Verify exact distribution from prompt:
      // 200 reading, 70 planned, 65 waiting, 55 stalled, 40 completed, 35 dropped, 35 rereading
      const stateCounts = db
        .prepare('SELECT personal_state, COUNT(*) as cnt FROM reading_relationships GROUP BY personal_state')
        .all() as Array<{ personal_state: string; cnt: number }>;

      const countsMap = new Map(stateCounts.map((r) => [r.personal_state, r.cnt]));
      expect(countsMap.get(PersonalState.Reading)).toBe(200);
      expect(countsMap.get(PersonalState.Planned)).toBe(70);
      expect(countsMap.get(PersonalState.Waiting)).toBe(65);
      expect(countsMap.get(PersonalState.Stalled)).toBe(55);
      expect(countsMap.get(PersonalState.Completed)).toBe(40);
      expect(countsMap.get(PersonalState.Dropped)).toBe(35);
      expect(countsMap.get(PersonalState.Rereading)).toBe(35);

      // Verify content types (manga ~40%, manhwa ~25%, LN ~15%, anime ~10%, other ~10%)
      const typeCounts = db
        .prepare('SELECT content_type, COUNT(*) as cnt FROM works GROUP BY content_type')
        .all() as Array<{ content_type: string; cnt: number }>;

      const typeMap = new Map(typeCounts.map((r) => [r.content_type, r.cnt]));
      expect(typeMap.get(ContentType.Manga)).toBe(200); // 40% of 500
      expect(typeMap.get(ContentType.Manhwa)).toBe(125); // 25% of 500
      expect(typeMap.get(ContentType.LightNovel)).toBe(75); // 15% of 500
      expect(typeMap.get(ContentType.Anime)).toBe(50); // 10% of 500
      expect(typeMap.get(ContentType.WebNovel)).toBe(50); // 10% of 500
    });
  });
});
