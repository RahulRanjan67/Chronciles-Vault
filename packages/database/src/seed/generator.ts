/**
 * Deterministic Seed Data Generator for Grimoire.
 *
 * Populates a SQLite database with realisticWorks, reading relationships,
 * access paths, progress logs, memories, captures, and update records.
 */

import type Database from 'better-sqlite3';
import {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  MemoryId,
  MemoryAssetId,
  CaptureId,
  CaptureBatchId,
  newId,
  type Work,
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  PersonalState,
  ReadingPriority,
  SourceHealth,
  type ProgressAnchor,
  MemoryType,
  SpoilerLevel,
  CaptureState,
  CaptureSource,
  UpdateCertainty,
  ProgressMethod,
  ProgressConfidence,
} from '@grimoire/domain';
import {
  GENRES,
  TAGS,
  PROVIDERS,
  TITLE_PREFIXES,
  TITLE_CORES,
  TITLE_SUFFIXES,
  BASE_SYNOPSES,
  MEMORY_TEMPLATES,
} from './fictional-data.js';
import { runInTransaction } from '../connection.js';

export interface SeedConfig {
  name: string;
  workCount: number;
  stateCounts: {
    reading: number;
    planned: number;
    waiting: number;
    stalled: number;
    completed: number;
    dropped: number;
    rereading: number;
  };
  contentTypeRatios: {
    manga: number;
    manhwa: number;
    light_novel: number;
    anime: number;
    other: number;
  };
  memoryCount: number;
  captureCount: number;
  updateCount: number;
  privateRatio: number; // e.g. 0.05 (5%)
  brokenSourceRatio: number; // e.g. 0.06 (6%)
  seed?: number;
}

export interface SeedStats {
  worksCreated: number;
  readingRelationshipsCreated: number;
  accessPathsCreated: number;
  memoriesCreated: number;
  capturesCreated: number;
  updatesCreated: number;
  durationMs: number;
}

/**
 * Simple Mulberry32 deterministic PRNG.
 */
class Rng {
  private s: number;
  constructor(seed = 1337) {
    this.s = seed >>> 0;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  intBetween(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  pickMany<T>(arr: readonly T[], count: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    for (let i = 0; i < count && copy.length > 0; i++) {
      const idx = Math.floor(this.next() * copy.length);
      result.push(copy.splice(idx, 1)[0]!);
    }
    return result;
  }
}

export function generateSeedData(config: SeedConfig) {
  const rng = new Rng(config.seed ?? 42);
  const now = new Date();

  // 1. Build list of personal states according to exact counts
  const targetStates: PersonalState[] = [];
  for (let i = 0; i < config.stateCounts.reading; i++) targetStates.push(PersonalState.Reading);
  for (let i = 0; i < config.stateCounts.planned; i++) targetStates.push(PersonalState.Planned);
  for (let i = 0; i < config.stateCounts.waiting; i++) targetStates.push(PersonalState.Waiting);
  for (let i = 0; i < config.stateCounts.stalled; i++) targetStates.push(PersonalState.Stalled);
  for (let i = 0; i < config.stateCounts.completed; i++) targetStates.push(PersonalState.Completed);
  for (let i = 0; i < config.stateCounts.dropped; i++) targetStates.push(PersonalState.Dropped);
  for (let i = 0; i < config.stateCounts.rereading; i++) targetStates.push(PersonalState.Rereading);

  // Pad or trim if state counts don't exactly equal workCount
  while (targetStates.length < config.workCount) {
    targetStates.push(PersonalState.Reading);
  }
  targetStates.length = config.workCount;

  // Shuffle states deterministically
  for (let i = targetStates.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const temp = targetStates[i]!;
    targetStates[i] = targetStates[j]!;
    targetStates[j] = temp;
  }

  // 2. Build list of content types according to exact ratios
  const targetTypes: ContentType[] = [];
  const mangaCount = Math.round(config.workCount * config.contentTypeRatios.manga);
  const manhwaCount = Math.round(config.workCount * config.contentTypeRatios.manhwa);
  const lnCount = Math.round(config.workCount * config.contentTypeRatios.light_novel);
  const animeCount = Math.round(config.workCount * config.contentTypeRatios.anime);
  const otherCount = config.workCount - (mangaCount + manhwaCount + lnCount + animeCount);

  for (let i = 0; i < mangaCount; i++) targetTypes.push(ContentType.Manga);
  for (let i = 0; i < manhwaCount; i++) targetTypes.push(ContentType.Manhwa);
  for (let i = 0; i < lnCount; i++) targetTypes.push(ContentType.LightNovel);
  for (let i = 0; i < animeCount; i++) targetTypes.push(ContentType.Anime);
  for (let i = 0; i < otherCount; i++) targetTypes.push(ContentType.WebNovel);

  while (targetTypes.length < config.workCount) targetTypes.push(ContentType.Manga);
  targetTypes.length = config.workCount;

  // Shuffle content types deterministically
  for (let i = targetTypes.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const temp = targetTypes[i]!;
    targetTypes[i] = targetTypes[j]!;
    targetTypes[j] = temp;
  }

  // 3. Generate Works
  const works: Work[] = [];
  const generatedTitles = new Set<string>();

  for (let i = 0; i < config.workCount; i++) {
    // Generate unique title
    let title = '';
    let attempts = 0;
    while (!title || generatedTitles.has(title)) {
      attempts++;
      const p = rng.pick(TITLE_PREFIXES);
      const c = rng.pick(TITLE_CORES);
      const s = rng.pick(TITLE_SUFFIXES);
      title = `${p} ${c}${s ? ' ' + s : ''}`.trim();
      if (attempts > 100) {
        title = `${title} (Vol. ${i + 1})`;
        break;
      }
    }
    generatedTitles.add(title);

    const contentType = targetTypes[i]!;
    const origin =
      contentType === ContentType.Manhwa || contentType === ContentType.WebNovel
        ? ContentOrigin.Korean
        : ContentOrigin.Japanese;

    const isPrivate = rng.next() < config.privateRatio;
    const privacyState = isPrivate ? (rng.next() < 0.5 ? PrivacyState.Private : PrivacyState.Vault) : PrivacyState.Public;

    const daysAgo = rng.intBetween(1, 400);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000).toISOString();
    const updatedDaysAgo = rng.intBetween(0, Math.min(daysAgo, 30));
    const updatedAt = new Date(now.getTime() - updatedDaysAgo * 86400000).toISOString();

    const genreCount = rng.intBetween(2, 4);
    const genres = rng.pickMany(GENRES, genreCount);

    const tagCount = rng.intBetween(2, 5);
    const tags = rng.pickMany(TAGS, tagCount);

    // Aliases
    const aliases: string[] = [];
    const altTitles: string[] = [];
    if (rng.next() > 0.4) {
      altTitles.push(`${title} (Official Translation)`);
    }
    if (rng.next() > 0.6) {
      const acronym = title
        .split(' ')
        .filter((w) => w.length > 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');
      if (acronym.length >= 2) aliases.push(acronym);
    }

    // External IDs
    const externalIds = [
      { provider: 'anilist', externalId: String(rng.intBetween(10000, 99999)) },
      { provider: 'mangadex', externalId: `md_${rng.intBetween(100000, 999999)}` },
    ];

    const workId = newId() as WorkId;
    works.push({
      id: workId,
      title,
      description: rng.pick(BASE_SYNOPSES),
      contentType,
      origin,
      publicationState: rng.pick([
        PublicationState.Ongoing,
        PublicationState.Ongoing,
        PublicationState.Completed,
        PublicationState.Hiatus,
      ]),
      privacyState,
      coverRef: `/assets/covers/cover_${rng.intBetween(1, 20)}.jpg`,
      alternativeTitles: altTitles,
      aliases,
      externalIds,
      genres,
      tags,
      createdAt,
      updatedAt,
      deletedAt: null,
    });
  }

  return { works, targetStates, rng, now };
}

/**
 * Execute seed generation and write all entities to the database in transactions.
 */
export function seedDatabase(db: Database.Database, config: SeedConfig): SeedStats {
  const startTime = Date.now();
  const { works, targetStates, rng, now } = generateSeedData(config);

  return runInTransaction(db, () => {
    // 1. Insert Works & related tables
    const insertWork = db.prepare(
      `INSERT INTO works (
        id, title, description, content_type, origin,
        publication_state, privacy_state, cover_ref,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertAlias = db.prepare(
      'INSERT INTO work_aliases (id, work_id, alias, alias_type) VALUES (?, ?, ?, ?)',
    );
    const insertExt = db.prepare(
      'INSERT INTO work_external_ids (id, work_id, provider, external_id) VALUES (?, ?, ?, ?)',
    );
    const insertGenre = db.prepare('INSERT INTO work_genres (work_id, genre) VALUES (?, ?)');
    const insertTag = db.prepare('INSERT INTO work_tags (work_id, tag) VALUES (?, ?)');
    const insertLookup = db.prepare(
      'INSERT INTO search_lookup(entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)',
    );
    const insertFts = db.prepare(
      'INSERT INTO search_fts(rowid, entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?, ?)',
    );

    for (const w of works) {
      insertWork.run(
        w.id,
        w.title,
        w.description,
        w.contentType,
        w.origin,
        w.publicationState,
        w.privacyState,
        w.coverRef,
        w.createdAt,
        w.updatedAt,
        w.deletedAt,
      );

      for (const alt of w.alternativeTitles) insertAlias.run(newId(), w.id, alt, 'alternative');
      for (const al of w.aliases) insertAlias.run(newId(), w.id, al, 'alias');
      for (const ext of w.externalIds) insertExt.run(newId(), w.id, ext.provider, ext.externalId);
      for (const g of w.genres) insertGenre.run(w.id, g);
      for (const t of w.tags) insertTag.run(w.id, t);

      if (w.privacyState === PrivacyState.Public) {
        const aliases = [...w.alternativeTitles, ...w.aliases].join(' ');
        const tags = [...w.genres, ...w.tags].join(' ');
        const content = [w.description ?? '', aliases].filter(Boolean).join(' ');
        const info = insertLookup.run('work', w.id, w.title, content, tags);
        insertFts.run(info.lastInsertRowid, 'work', w.id, w.title, content, tags);
      }
    }

    // 2. Reading Relationships & Progress Events
    const insertRel = db.prepare(
      `INSERT INTO reading_relationships (
        id, work_id, personal_state, priority, started_at,
        last_active_at, completed_at, stopped_at, stopped_reason,
        stopped_note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertProgress = db.prepare(
      `INSERT INTO progress_events (
        id, work_id, reading_relationship_id, access_path_id,
        method, confidence, anchor_before, anchor_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertAttempt = db.prepare(
      `INSERT INTO reading_attempts (
        id, work_id, reading_relationship_id, attempt_number,
        started_at, ended_at, final_anchor, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const relationships: Array<{ id: string; workId: string; state: PersonalState }> = [];

    for (let i = 0; i < works.length; i++) {
      const w = works[i]!;
      const state = targetStates[i]!;
      const relId = newId() as ReadingRelationshipId;
      relationships.push({ id: relId, workId: w.id, state });

      const currentChapter = rng.intBetween(5, 120);
      const isCompleted = state === PersonalState.Completed;
      const isDropped = state === PersonalState.Dropped;
      const isReading = state === PersonalState.Reading || state === PersonalState.Rereading;

      const startedAt = state !== PersonalState.Planned ? w.createdAt : null;
      const completedAt = isCompleted ? w.updatedAt : null;
      const stoppedAt = isDropped ? w.updatedAt : null;

      const priority = rng.pick([
        ReadingPriority.Normal,
        ReadingPriority.Normal,
        ReadingPriority.High,
        ReadingPriority.Low,
        ReadingPriority.Urgent,
      ]);

      insertRel.run(
        relId,
        w.id,
        state,
        priority,
        startedAt,
        w.updatedAt,
        completedAt,
        stoppedAt,
        isDropped ? 'Pacing dragged after Chapter 50' : null,
        null,
        w.createdAt,
        w.updatedAt,
      );

      // Add progress event if active or completed
      if (state !== PersonalState.Planned) {
        const anchor: ProgressAnchor = {
          type: 'chapter',
          chapter: currentChapter,
          title: `Chapter ${currentChapter}`,
        } as any;

        insertProgress.run(
          newId(),
          w.id,
          relId,
          null,
          ProgressMethod.Manual,
          ProgressConfidence.Confirmed,
          null,
          JSON.stringify(anchor),
          w.updatedAt,
        );

        // Add an attempt record
        insertAttempt.run(
          newId(),
          w.id,
          relId,
          1,
          startedAt ?? w.createdAt,
          isCompleted ? completedAt : null,
          isCompleted ? JSON.stringify(anchor) : null,
          isCompleted ? 'Finished main storyline.' : null,
          w.createdAt,
        );
      }
    }

    // 3. Access Paths (~1-2 per work, with broken sources according to brokenSourceRatio)
    const insertAccessPath = db.prepare(
      `INSERT INTO access_paths (
        id, work_id, kind, provider, label, url, file_id,
        is_preferred, health_state, last_checked_at, last_opened_at,
        provenance, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertCap = db.prepare(
      'INSERT INTO source_capabilities (access_path_id, capability, status) VALUES (?, ?, ?)',
    );

    let accessPathCount = 0;
    const accessPathIds: string[] = [];

    for (const w of works) {
      const provider = rng.pick(PROVIDERS);
      const isBroken = rng.next() < config.brokenSourceRatio;
      const health = isBroken ? SourceHealth.Broken : SourceHealth.Healthy;
      const pathId = newId() as AccessPathId;
      accessPathIds.push(pathId);
      accessPathCount++;

      const url = `https://${provider.domain}/title/${w.id}`;
      insertAccessPath.run(
        pathId,
        w.id,
        provider.kind,
        provider.name,
        `${provider.name} Stream`,
        url,
        null,
        1, // preferred
        health,
        w.updatedAt,
        w.updatedAt,
        JSON.stringify({ source: 'seed_generator' }),
        w.createdAt,
        w.updatedAt,
      );

      insertCap.run(pathId, 'read', 'supported');
      insertCap.run(pathId, 'progress_sync', isBroken ? 'unsupported' : 'supported');
    }

    // 4. Memories (~memoryCount across the dataset)
    const insertMemory = db.prepare(
      `INSERT INTO memories (
        id, work_id, type, title, body,
        privacy_state, spoiler_level, show_in_global_gallery,
        access_path_id, progress_anchor, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertMemTag = db.prepare('INSERT INTO memory_tags (memory_id, tag) VALUES (?, ?)');
    const insertMemAsset = db.prepare(
      `INSERT INTO memory_assets (id, memory_id, asset_type, file_id, thumbnail_ref, width, height, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (let i = 0; i < config.memoryCount; i++) {
      const randomWork = rng.pick(works);
      const template = rng.pick(MEMORY_TEMPLATES);
      const memId = newId() as MemoryId;
      const isPrivate = randomWork.privacyState !== PrivacyState.Public || rng.next() < 0.1;

      insertMemory.run(
        memId,
        randomWork.id,
        template.type,
        `${template.title} - ${randomWork.title}`,
        template.body,
        isPrivate ? 'private' : 'normal',
        rng.pick([SpoilerLevel.SpoilerFree, SpoilerLevel.Minor]),
        isPrivate ? 0 : 1,
        null,
        JSON.stringify({ type: 'chapter', chapter: rng.intBetween(1, 50) }),
        randomWork.updatedAt,
        randomWork.updatedAt,
      );

      insertMemTag.run(memId, rng.pick(['favorite', 'climax', 'art', 'theory', 'character']));

      if (template.type === 'screenshot') {
        insertMemAsset.run(
          newId(),
          memId,
          'image',
          `asset_${rng.intBetween(100, 999)}.webp`,
          `/thumbs/asset_${rng.intBetween(100, 999)}.jpg`,
          1920,
          1080,
          randomWork.updatedAt,
        );
      }

      if (!isPrivate) {
        const memTitle = `${template.title} - ${randomWork.title}`;
        const tags = 'screenshot favorite';
        const info = insertLookup.run('memory', memId, memTitle, template.body, tags);
        insertFts.run(info.lastInsertRowid, 'memory', memId, memTitle, template.body, tags);
      }
    }

    // 5. Captures (~captureCount)
    const insertBatch = db.prepare(
      `INSERT INTO capture_batches (id, label, source, item_count, processed_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    const insertCapture = db.prepare(
      `INSERT INTO captures (
        id, batch_id, url, normalized_url, title,
        favicon_ref, browser, window_label, captured_at,
        possible_work_id, confidence_score, state, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const batch1 = newId() as CaptureBatchId;
    const batch2 = newId() as CaptureBatchId;
    insertBatch.run(batch1, 'Sunday Night Tab Dump', CaptureSource.BrowserTabs, Math.floor(config.captureCount / 2), 10, now.toISOString());
    insertBatch.run(batch2, 'Mobile Bookmarks Import', CaptureSource.Bookmarks, Math.ceil(config.captureCount / 2), 5, now.toISOString());

    for (let i = 0; i < config.captureCount; i++) {
      const matchWork = rng.next() > 0.3 ? rng.pick(works) : null;
      const batchId = i < config.captureCount / 2 ? batch1 : batch2;
      const capId = newId() as CaptureId;
      const state = matchWork
        ? rng.pick([CaptureState.Pending, CaptureState.Matched, CaptureState.Matched])
        : CaptureState.Pending;

      const url = matchWork
        ? `https://mangadex.org/chapter/${rng.intBetween(1000, 9999)}/1`
        : `https://reading-portal.org/series/unknown-${i}`;

      insertCapture.run(
        capId,
        batchId,
        url,
        url,
        matchWork ? `${matchWork.title} - Chapter ${rng.intBetween(1, 100)}` : `Reading Tab ${i + 1}`,
        'https://mangadex.org/favicon.ico',
        'Brave',
        'Window 1',
        now.toISOString(),
        matchWork ? matchWork.id : null,
        matchWork ? 0.95 : 0.2,
        state,
        now.toISOString(),
      );
    }

    // 6. Update Entries (~updateCount)
    const insertUpdate = db.prepare(
      `INSERT INTO update_entries (
        id, work_id, access_path_id, anchor, certainty,
        source, detected_at, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (let i = 0; i < config.updateCount; i++) {
      const work = rng.pick(works);
      const ch = rng.intBetween(10, 150);
      const anchor = JSON.stringify({ type: 'chapter', chapter: ch, label: `Chapter ${ch}` });
      insertUpdate.run(
        newId(),
        work.id,
        null,
        anchor,
        UpdateCertainty.Confirmed,
        'MangaDex RSS Feed',
        now.toISOString(),
        now.toISOString(),
      );
    }

    const durationMs = Date.now() - startTime;
    return {
      worksCreated: works.length,
      readingRelationshipsCreated: relationships.length,
      accessPathsCreated: accessPathCount,
      memoriesCreated: config.memoryCount,
      capturesCreated: config.captureCount,
      updatesCreated: config.updateCount,
      durationMs,
    };
  });
}
