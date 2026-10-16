/**
 * WorkRepositoryImpl - SQLite implementation of WorkRepository using better-sqlite3.
 *
 * Implements full CRUD, FTS5 sync, batch queries to prevent N+1 issues,
 * duplicate detection, and merging within atomic transactions.
 */

import type Database from 'better-sqlite3';
import {
  WorkId,
  newId,
  type Work,
  type WorkSummary,
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  type ExternalIdentifier,
  type WorkRepository,
  type WorkListQuery,
  type WorkSearchQuery,
  type WorkSearchResult,
  type DuplicateCandidate,
  type MergeResolution,
  type PaginatedResult,
  type ArchiveReason,
} from '@chronicles-vault/domain';
import { runInTransaction } from '../connection.js';

interface WorkRow {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  origin: string;
  publication_state: string;
  privacy_state: string;
  cover_ref: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface AliasRow {
  work_id: string;
  alias: string;
  alias_type: string;
}

interface ExternalIdRow {
  work_id: string;
  provider: string;
  external_id: string;
}

interface GenreRow {
  work_id: string;
  genre: string;
}

interface TagRow {
  work_id: string;
  tag: string;
}

export class WorkRepositoryImpl implements WorkRepository {
  constructor(private readonly db: Database.Database) {}

  /**
   * Helper: sync Work to FTS5 search table.
   * If public, inserts or replaces FTS entry. If private/vault/deleted, removes it.
   */
  private syncFts(work: Work): void {
    const existing = this.db
      .prepare('SELECT rowid FROM search_lookup WHERE entity_type = ? AND entity_id = ?')
      .get('work', work.id) as { rowid: number } | undefined;

    if (existing) {
      try {
        this.db.prepare('DELETE FROM search_fts WHERE rowid = ?').run(existing.rowid);
      } catch {
        // ignore
      }
      this.db.prepare('DELETE FROM search_lookup WHERE rowid = ?').run(existing.rowid);
    }

    // Only index non-deleted, public works
    if (!work.deletedAt && work.privacyState === PrivacyState.Public) {
      const allAliases = [...work.alternativeTitles, ...work.aliases].join(' ');
      const allTags = [...work.genres, ...work.tags].join(' ');
      const content = [work.description ?? '', allAliases].filter(Boolean).join(' ');

      const info = this.db
        .prepare(
          `INSERT INTO search_lookup(entity_type, entity_id, title, content, tags)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run('work', work.id, work.title, content, allTags);

      try {
        this.db
          .prepare(
            `INSERT INTO search_fts(rowid, entity_type, entity_id, title, content, tags)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(info.lastInsertRowid, 'work', work.id, work.title, content, allTags);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Helper: Hydrate multiple Work entities given their database rows, batching child tables.
   */
  private hydrateWorks(rows: WorkRow[]): Work[] {
    if (rows.length === 0) return [];

    const workIds = rows.map((r) => r.id);
    const placeholders = workIds.map(() => '?').join(',');

    // Fetch aliases
    const aliases = this.db
      .prepare(`SELECT work_id, alias, alias_type FROM work_aliases WHERE work_id IN (${placeholders})`)
      .all(...workIds) as AliasRow[];

    // Fetch external IDs
    const extIds = this.db
      .prepare(`SELECT work_id, provider, external_id FROM work_external_ids WHERE work_id IN (${placeholders})`)
      .all(...workIds) as ExternalIdRow[];

    // Fetch genres
    const genres = this.db
      .prepare(`SELECT work_id, genre FROM work_genres WHERE work_id IN (${placeholders})`)
      .all(...workIds) as GenreRow[];

    // Fetch tags
    const tags = this.db
      .prepare(`SELECT work_id, tag FROM work_tags WHERE work_id IN (${placeholders})`)
      .all(...workIds) as TagRow[];

    // Group children by work_id
    const altTitlesMap = new Map<string, string[]>();
    const aliasesMap = new Map<string, string[]>();
    for (const a of aliases) {
      if (a.alias_type === 'alternative') {
        const list = altTitlesMap.get(a.work_id) ?? [];
        list.push(a.alias);
        altTitlesMap.set(a.work_id, list);
      } else {
        const list = aliasesMap.get(a.work_id) ?? [];
        list.push(a.alias);
        aliasesMap.set(a.work_id, list);
      }
    }

    const extIdsMap = new Map<string, ExternalIdentifier[]>();
    for (const e of extIds) {
      const list = extIdsMap.get(e.work_id) ?? [];
      list.push({ provider: e.provider, externalId: e.external_id });
      extIdsMap.set(e.work_id, list);
    }

    const genresMap = new Map<string, string[]>();
    for (const g of genres) {
      const list = genresMap.get(g.work_id) ?? [];
      list.push(g.genre);
      genresMap.set(g.work_id, list);
    }

    const tagsMap = new Map<string, string[]>();
    for (const t of tags) {
      const list = tagsMap.get(t.work_id) ?? [];
      list.push(t.tag);
      tagsMap.set(t.work_id, list);
    }

    return rows.map((r) => ({
      id: r.id as WorkId,
      title: r.title,
      description: r.description,
      contentType: r.content_type as ContentType,
      origin: r.origin as ContentOrigin,
      publicationState: r.publication_state as PublicationState,
      privacyState: r.privacy_state as PrivacyState,
      coverRef: r.cover_ref,
      alternativeTitles: altTitlesMap.get(r.id) ?? [],
      aliases: aliasesMap.get(r.id) ?? [],
      externalIds: extIdsMap.get(r.id) ?? [],
      genres: genresMap.get(r.id) ?? [],
      tags: tagsMap.get(r.id) ?? [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at,
    }));
  }

  /**
   * Helper: Hydrate multiple WorkSummary items without heavy fields.
   */
  private hydrateSummaries(rows: WorkRow[]): WorkSummary[] {
    if (rows.length === 0) return [];

    const workIds = rows.map((r) => r.id);
    const placeholders = workIds.map(() => '?').join(',');

    const aliases = this.db
      .prepare(`SELECT work_id, alias FROM work_aliases WHERE work_id IN (${placeholders})`)
      .all(...workIds) as Array<{ work_id: string; alias: string }>;

    const genres = this.db
      .prepare(`SELECT work_id, genre FROM work_genres WHERE work_id IN (${placeholders})`)
      .all(...workIds) as GenreRow[];

    const aliasesMap = new Map<string, string[]>();
    for (const a of aliases) {
      const list = aliasesMap.get(a.work_id) ?? [];
      list.push(a.alias);
      aliasesMap.set(a.work_id, list);
    }

    const genresMap = new Map<string, string[]>();
    for (const g of genres) {
      const list = genresMap.get(g.work_id) ?? [];
      list.push(g.genre);
      genresMap.set(g.work_id, list);
    }

    return rows.map((r) => ({
      id: r.id as WorkId,
      title: r.title,
      aliases: aliasesMap.get(r.id) ?? [],
      contentType: r.content_type as ContentType,
      origin: r.origin as ContentOrigin,
      publicationState: r.publication_state as PublicationState,
      privacyState: r.privacy_state as PrivacyState,
      coverRef: r.cover_ref,
      genres: genresMap.get(r.id) ?? [],
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at,
    }));
  }

  async create(work: Work): Promise<Work> {
    return runInTransaction(this.db, () => {
      this.db.prepare(
        `INSERT INTO works (
          id, title, description, content_type, origin,
          publication_state, privacy_state, cover_ref,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        work.id,
        work.title,
        work.description ?? null,
        work.contentType,
        work.origin,
        work.publicationState,
        work.privacyState,
        work.coverRef ?? null,
        work.createdAt,
        work.updatedAt,
        work.deletedAt ?? null,
      );

      // Insert alternative titles
      const insertAlias = this.db.prepare(
        'INSERT OR IGNORE INTO work_aliases (id, work_id, alias, alias_type) VALUES (?, ?, ?, ?)',
      );
      for (const alt of work.alternativeTitles) {
        insertAlias.run(newId(), work.id, alt, 'alternative');
      }
      for (const al of work.aliases) {
        insertAlias.run(newId(), work.id, al, 'alias');
      }

      // Insert external IDs
      const insertExtId = this.db.prepare(
        'INSERT OR IGNORE INTO work_external_ids (id, work_id, provider, external_id) VALUES (?, ?, ?, ?)',
      );
      for (const ext of work.externalIds) {
        insertExtId.run(newId(), work.id, ext.provider, ext.externalId);
      }

      // Insert genres
      const insertGenre = this.db.prepare(
        'INSERT OR IGNORE INTO work_genres (work_id, genre) VALUES (?, ?)',
      );
      for (const g of work.genres) {
        insertGenre.run(work.id, g);
      }

      // Insert tags
      const insertTag = this.db.prepare(
        'INSERT OR IGNORE INTO work_tags (work_id, tag) VALUES (?, ?)',
      );
      for (const t of work.tags) {
        insertTag.run(work.id, t);
      }

      this.syncFts(work);
      return work;
    });
  }

  async getById(id: WorkId): Promise<Work | null> {
    const row = this.db.prepare('SELECT * FROM works WHERE id = ?').get(id) as WorkRow | undefined;
    if (!row) return null;
    const [hydrated] = this.hydrateWorks([row]);
    return hydrated ?? null;
  }

  async findById(id: WorkId): Promise<Work | null> {
    return this.getById(id);
  }

  async findByIds(ids: readonly WorkId[]): Promise<Work[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(`SELECT * FROM works WHERE id IN (${placeholders})`)
      .all(...ids) as WorkRow[];
    return this.hydrateWorks(rows);
  }

  async update(id: WorkId, patch: Partial<Work>): Promise<Work> {
    return runInTransaction(this.db, () => {
      const existing = this.db.prepare('SELECT * FROM works WHERE id = ?').get(id) as WorkRow | undefined;
      if (!existing) {
        throw new Error(`Work with id ${id} not found`);
      }

      const now = new Date().toISOString();
      const updatedTitle = patch.title ?? existing.title;
      const updatedDesc = patch.description !== undefined ? patch.description : existing.description;
      const updatedType = patch.contentType ?? existing.content_type;
      const updatedOrigin = patch.origin ?? existing.origin;
      const updatedPubState = patch.publicationState ?? existing.publication_state;
      const updatedPrivState = patch.privacyState ?? existing.privacy_state;
      const updatedCoverRef = patch.coverRef !== undefined ? patch.coverRef : existing.cover_ref;
      const updatedDeletedAt = patch.deletedAt !== undefined ? patch.deletedAt : existing.deleted_at;

      this.db.prepare(
        `UPDATE works SET
          title = ?, description = ?, content_type = ?, origin = ?,
          publication_state = ?, privacy_state = ?, cover_ref = ?,
          updated_at = ?, deleted_at = ?
         WHERE id = ?`,
      ).run(
        updatedTitle,
        updatedDesc,
        updatedType,
        updatedOrigin,
        updatedPubState,
        updatedPrivState,
        updatedCoverRef,
        now,
        updatedDeletedAt,
        id,
      );

      // Update child tables if specified
      if (patch.alternativeTitles !== undefined || patch.aliases !== undefined) {
        this.db.prepare('DELETE FROM work_aliases WHERE work_id = ?').run(id);
        const insertAlias = this.db.prepare(
          'INSERT OR IGNORE INTO work_aliases (id, work_id, alias, alias_type) VALUES (?, ?, ?, ?)',
        );
        const altTitles = patch.alternativeTitles ?? [];
        const aliases = patch.aliases ?? [];
        for (const alt of altTitles) insertAlias.run(newId(), id, alt, 'alternative');
        for (const al of aliases) insertAlias.run(newId(), id, al, 'alias');
      }

      if (patch.externalIds !== undefined) {
        this.db.prepare('DELETE FROM work_external_ids WHERE work_id = ?').run(id);
        const insertExtId = this.db.prepare(
          'INSERT OR IGNORE INTO work_external_ids (id, work_id, provider, external_id) VALUES (?, ?, ?, ?)',
        );
        for (const ext of patch.externalIds) {
          insertExtId.run(newId(), id, ext.provider, ext.externalId);
        }
      }

      if (patch.genres !== undefined) {
        this.db.prepare('DELETE FROM work_genres WHERE work_id = ?').run(id);
        const insertGenre = this.db.prepare(
          'INSERT OR IGNORE INTO work_genres (work_id, genre) VALUES (?, ?)',
        );
        for (const g of patch.genres) insertGenre.run(id, g);
      }

      if (patch.tags !== undefined) {
        this.db.prepare('DELETE FROM work_tags WHERE work_id = ?').run(id);
        const insertTag = this.db.prepare(
          'INSERT OR IGNORE INTO work_tags (work_id, tag) VALUES (?, ?)',
        );
        for (const t of patch.tags) insertTag.run(id, t);
      }

      const freshRow = this.db.prepare('SELECT * FROM works WHERE id = ?').get(id) as WorkRow;
      const [hydrated] = this.hydrateWorks([freshRow]);
      if (!hydrated) throw new Error(`Work with id ${id} could not be loaded after update`);

      this.syncFts(hydrated);
      return hydrated;
    });
  }

  async save(work: Work): Promise<void> {
    const existing = this.db.prepare('SELECT id FROM works WHERE id = ?').get(work.id);
    if (existing) {
      await this.update(work.id, work);
    } else {
      await this.create(work);
    }
  }

  async saveMany(works: readonly Work[]): Promise<void> {
    runInTransaction(this.db, () => {
      for (const w of works) {
        const existing = this.db.prepare('SELECT id FROM works WHERE id = ?').get(w.id);
        if (existing) {
          this.update(w.id, w);
        } else {
          this.create(w);
        }
      }
    });
  }

  async archive(id: WorkId, reason: ArchiveReason, note?: string): Promise<void> {
    runInTransaction(this.db, () => {
      const work = this.db.prepare('SELECT * FROM works WHERE id = ?').get(id) as WorkRow | undefined;
      if (!work) return;

      const now = new Date().toISOString();
      this.db.prepare('UPDATE works SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);

      this.db.prepare(
        `INSERT INTO archive_records (id, work_id, reason, note, previous_state, archived_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(newId(), id, reason, note ?? null, work.publication_state, now);

      // Remove from FTS
      this.db.prepare('DELETE FROM search_fts WHERE entity_type = ? AND entity_id = ?').run('work', id);
    });
  }

  async delete(id: WorkId): Promise<void> {
    runInTransaction(this.db, () => {
      this.db.prepare('DELETE FROM works WHERE id = ?').run(id);
      this.db.prepare('DELETE FROM search_fts WHERE entity_type = ? AND entity_id = ?').run('work', id);
    });
  }

  async softDelete(id: WorkId): Promise<void> {
    const now = new Date().toISOString();
    runInTransaction(this.db, () => {
      this.db.prepare('UPDATE works SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
      this.db.prepare('DELETE FROM search_fts WHERE entity_type = ? AND entity_id = ?').run('work', id);
    });
  }

  async restore(id: WorkId): Promise<void> {
    runInTransaction(this.db, () => {
      const now = new Date().toISOString();
      this.db.prepare('UPDATE works SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now, id);
      const row = this.db.prepare('SELECT * FROM works WHERE id = ?').get(id) as WorkRow | undefined;
      if (row) {
        const [hydrated] = this.hydrateWorks([row]);
        if (hydrated) this.syncFts(hydrated);
      }
    });
  }

  async list(query: WorkListQuery): Promise<PaginatedResult<WorkSummary>> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (!query.includeDeleted) {
      conditions.push('w.deleted_at IS NULL');
    }

    if (query.contentTypes && query.contentTypes.length > 0) {
      const placeholders = query.contentTypes.map(() => '?').join(',');
      conditions.push(`w.content_type IN (${placeholders})`);
      params.push(...query.contentTypes);
    }

    if (query.publicationStates && query.publicationStates.length > 0) {
      const placeholders = query.publicationStates.map(() => '?').join(',');
      conditions.push(`w.publication_state IN (${placeholders})`);
      params.push(...query.publicationStates);
    }

    if (query.privacyStates && query.privacyStates.length > 0) {
      const placeholders = query.privacyStates.map(() => '?').join(',');
      conditions.push(`w.privacy_state IN (${placeholders})`);
      params.push(...query.privacyStates);
    }

    if (query.genres && query.genres.length > 0) {
      const placeholders = query.genres.map(() => '?').join(',');
      conditions.push(
        `w.id IN (SELECT work_id FROM work_genres WHERE genre IN (${placeholders}))`,
      );
      params.push(...query.genres);
    }

    if (query.tags && query.tags.length > 0) {
      const placeholders = query.tags.map(() => '?').join(',');
      conditions.push(
        `w.id IN (SELECT work_id FROM work_tags WHERE tag IN (${placeholders}))`,
      );
      params.push(...query.tags);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const countSql = `SELECT COUNT(*) as total FROM works w ${whereClause}`;
    const { total } = this.db.prepare(countSql).get(...params) as { total: number };

    // Sorting
    const sortField = query.sortBy === 'title' ? 'w.title COLLATE NOCASE' : query.sortBy === 'createdAt' ? 'w.created_at' : 'w.updated_at';
    const sortDir = query.sortDirection === 'asc' ? 'ASC' : 'DESC';

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const dataSql = `SELECT w.* FROM works w ${whereClause} ORDER BY ${sortField} ${sortDir} LIMIT ? OFFSET ?`;
    const rows = this.db.prepare(dataSql).all(...params, limit, offset) as WorkRow[];
    const summaries = this.hydrateSummaries(rows);

    return {
      items: summaries,
      totalCount: total,
      offset,
      limit,
      hasMore: offset + summaries.length < total,
    };
  }

  async search(query: WorkSearchQuery): Promise<readonly WorkSearchResult[]> {
    const rawQuery = query.query.trim();
    if (!rawQuery) return [];

    const limit = query.limit ?? 20;

    const cleanTokens = rawQuery
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (cleanTokens.length > 0) {
      const ftsQuery = cleanTokens.map((t) => `${t}*`).join(' ');
      try {
        const ftsMatches = this.db
          .prepare(
            `SELECT l.entity_id, s.rank
             FROM search_fts s
             JOIN search_lookup l ON l.rowid = s.rowid
             WHERE l.entity_type = 'work' AND s.search_fts MATCH ?
             ORDER BY s.rank
             LIMIT ?`,
          )
          .all(ftsQuery, limit) as Array<{ entity_id: string; rank: number }>;

        if (ftsMatches.length > 0) {
          const workIds = ftsMatches.map((m) => m.entity_id);
          const placeholders = workIds.map(() => '?').join(',');
          const rows = this.db
            .prepare(`SELECT * FROM works WHERE id IN (${placeholders}) AND deleted_at IS NULL`)
            .all(...workIds) as WorkRow[];
          const summaries = this.hydrateSummaries(rows);
          const summaryMap = new Map(summaries.map((s) => [s.id, s]));

          const results: WorkSearchResult[] = [];
          for (const m of ftsMatches) {
            const work = summaryMap.get(m.entity_id as WorkId);
            if (work) {
              results.push({
                work,
                score: Math.abs(m.rank),
                matchedOn: 'title',
              });
            }
          }
          if (results.length > 0) return results;
        }
      } catch {
        // fallback to LIKE query below
      }
    }

    // Fallback: LIKE prefix match on title or alias
    const likePattern = `%${rawQuery}%`;
    const titleMatches = this.db
      .prepare(
        `SELECT w.* FROM works w
         WHERE w.deleted_at IS NULL AND (
           w.title LIKE ? OR
           w.id IN (SELECT work_id FROM work_aliases WHERE alias LIKE ?)
         )
         LIMIT ?`,
      )
      .all(likePattern, likePattern, limit) as WorkRow[];

    const summaries = this.hydrateSummaries(titleMatches);
    return summaries.map((s) => ({
      work: s,
      score: 1.0,
      matchedOn: 'title' as const,
    }));
  }

  async findDuplicates(work: Partial<Work>): Promise<readonly DuplicateCandidate[]> {
    const candidates: Map<string, DuplicateCandidate> = new Map();

    // 1. Check exact match on external IDs (highest confidence)
    if (work.externalIds && work.externalIds.length > 0) {
      for (const ext of work.externalIds) {
        const row = this.db
          .prepare(
            `SELECT w.* FROM works w
             JOIN work_external_ids e ON e.work_id = w.id
             WHERE e.provider = ? AND e.external_id = ? AND w.deleted_at IS NULL`,
          )
          .get(ext.provider, ext.externalId) as WorkRow | undefined;

        if (row && row.id !== work.id) {
          const [summary] = this.hydrateSummaries([row]);
          if (summary) {
            candidates.set(row.id, {
              work: summary,
              confidence: 0.99,
              matchedFields: [`externalId:${ext.provider}`],
            });
          }
        }
      }
    }

    // 2. Check match on primary title (case insensitive)
    if (work.title) {
      const normalizedTitle = work.title.trim().toLowerCase();
      const rows = this.db
        .prepare(
          `SELECT w.* FROM works w
           WHERE LOWER(TRIM(w.title)) = ? AND w.deleted_at IS NULL`,
        )
        .all(normalizedTitle) as WorkRow[];

      for (const row of rows) {
        if (row.id === work.id) continue;
        const existing = candidates.get(row.id);
        if (existing) {
          candidates.set(row.id, {
            ...existing,
            confidence: Math.max(existing.confidence, 0.95),
            matchedFields: [...existing.matchedFields, 'title'],
          });
        } else {
          const [summary] = this.hydrateSummaries([row]);
          if (summary) {
            candidates.set(row.id, {
              work: summary,
              confidence: 0.95,
              matchedFields: ['title'],
            });
          }
        }
      }

      // Check title against aliases of other works
      const aliasRows = this.db
        .prepare(
          `SELECT w.* FROM works w
           JOIN work_aliases a ON a.work_id = w.id
           WHERE LOWER(TRIM(a.alias)) = ? AND w.deleted_at IS NULL`,
        )
        .all(normalizedTitle) as WorkRow[];

      for (const row of aliasRows) {
        if (row.id === work.id) continue;
        const existing = candidates.get(row.id);
        if (existing) {
          candidates.set(row.id, {
            ...existing,
            confidence: Math.max(existing.confidence, 0.85),
            matchedFields: [...existing.matchedFields, 'alias'],
          });
        } else {
          const [summary] = this.hydrateSummaries([row]);
          if (summary) {
            candidates.set(row.id, {
              work: summary,
              confidence: 0.85,
              matchedFields: ['alias'],
            });
          }
        }
      }
    }

    return Array.from(candidates.values()).sort((a, b) => b.confidence - a.confidence);
  }

  async merge(sourceId: WorkId, targetId: WorkId, resolution: MergeResolution): Promise<Work> {
    return runInTransaction(this.db, () => {
      const targetWork = this.db.prepare('SELECT * FROM works WHERE id = ?').get(targetId) as WorkRow | undefined;
      const sourceWork = this.db.prepare('SELECT * FROM works WHERE id = ?').get(sourceId) as WorkRow | undefined;

      if (!targetWork || !sourceWork) {
        throw new Error(`Cannot merge: source (${sourceId}) or target (${targetId}) not found`);
      }

      const now = new Date().toISOString();

      // 1. Transfer reading relationships: if target has none, reassign source's relationship
      const targetRel = this.db.prepare('SELECT id FROM reading_relationships WHERE work_id = ?').get(targetId);
      if (!targetRel) {
        this.db.prepare('UPDATE reading_relationships SET work_id = ?, updated_at = ? WHERE work_id = ?').run(targetId, now, sourceId);
      } else {
        // Target already has relationship: reassign attempts and sessions
        const sourceRel = this.db.prepare('SELECT id FROM reading_relationships WHERE work_id = ?').get(sourceId) as { id: string } | undefined;
        if (sourceRel) {
          this.db.prepare('UPDATE reading_attempts SET work_id = ?, reading_relationship_id = ? WHERE reading_relationship_id = ?').run(targetId, (targetRel as { id: string }).id, sourceRel.id);
          this.db.prepare('UPDATE reading_sessions SET work_id = ?, reading_relationship_id = ? WHERE reading_relationship_id = ?').run(targetId, (targetRel as { id: string }).id, sourceRel.id);
          this.db.prepare('DELETE FROM reading_relationships WHERE id = ?').run(sourceRel.id);
        }
      }

      // 2. Reassign access paths, progress events, memories, captures, update entries
      this.db.prepare('UPDATE access_paths SET work_id = ?, updated_at = ? WHERE work_id = ?').run(targetId, now, sourceId);
      this.db.prepare('UPDATE progress_events SET work_id = ? WHERE work_id = ?').run(targetId, sourceId);
      this.db.prepare('UPDATE memories SET work_id = ?, updated_at = ? WHERE work_id = ?').run(targetId, now, sourceId);
      this.db.prepare('UPDATE captures SET possible_work_id = ? WHERE possible_work_id = ?').run(targetId, sourceId);
      this.db.prepare('UPDATE update_entries SET work_id = ? WHERE work_id = ?').run(targetId, sourceId);

      // 3. Apply merged metadata
      if (resolution.preferredCoverRef !== undefined) {
        this.db.prepare('UPDATE works SET cover_ref = ?, updated_at = ? WHERE id = ?').run(resolution.preferredCoverRef, now, targetId);
      }

      // Add merged aliases
      const insertAlias = this.db.prepare(
        'INSERT OR IGNORE INTO work_aliases (id, work_id, alias, alias_type) VALUES (?, ?, ?, ?)',
      );
      for (const al of resolution.mergedAliases) {
        insertAlias.run(newId(), targetId, al, 'alternative');
      }

      // Add merged external IDs
      const insertExt = this.db.prepare(
        'INSERT OR IGNORE INTO work_external_ids (id, work_id, provider, external_id) VALUES (?, ?, ?, ?)',
      );
      for (const ext of resolution.mergedExternalIds) {
        insertExt.run(newId(), targetId, ext.provider, ext.externalId);
      }

      // Add merged genres
      const insertGenre = this.db.prepare(
        'INSERT OR IGNORE INTO work_genres (work_id, genre) VALUES (?, ?)',
      );
      for (const g of resolution.mergedGenres) {
        insertGenre.run(targetId, g);
      }

      // Add merged tags
      const insertTag = this.db.prepare(
        'INSERT OR IGNORE INTO work_tags (work_id, tag) VALUES (?, ?)',
      );
      for (const t of resolution.mergedTags) {
        insertTag.run(targetId, t);
      }

      // 4. Soft delete source work
      this.db.prepare('UPDATE works SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, sourceId);
      this.db.prepare('DELETE FROM search_fts WHERE entity_type = ? AND entity_id = ?').run('work', sourceId);

      // 5. Return updated target work
      const targetRow = this.db.prepare('SELECT * FROM works WHERE id = ?').get(targetId) as WorkRow;
      const [hydrated] = this.hydrateWorks([targetRow]);
      if (!hydrated) throw new Error('Failed to hydrate merged work');

      this.syncFts(hydrated);
      return hydrated;
    });
  }

  async count(filter?: { contentType?: string; publicationState?: string; privacyState?: string }): Promise<number> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filter?.contentType) {
      conditions.push('content_type = ?');
      params.push(filter.contentType);
    }
    if (filter?.publicationState) {
      conditions.push('publication_state = ?');
      params.push(filter.publicationState);
    }
    if (filter?.privacyState) {
      conditions.push('privacy_state = ?');
      params.push(filter.privacyState);
    }

    const { count } = this.db
      .prepare(`SELECT COUNT(*) as count FROM works WHERE ${conditions.join(' AND ')}`)
      .get(...params) as { count: number };

    return count;
  }
}
