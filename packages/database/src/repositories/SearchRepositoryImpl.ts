/**
 * SearchRepositoryImpl - SQLite FTS5 implementation of SearchRepository using better-sqlite3.
 *
 * Implements full-text search with scope filtering, ranking, snippet generation,
 * and vault-awareness (strictly excluding private/vault data from public search).
 */

import type Database from 'better-sqlite3';
import {
  type Work,
  type Memory,
  PrivacyState,
  type SearchRepository,
  type SearchScope,
  type SearchResults,
  type SearchMatch,
} from '@grimoire/domain';
import { runInTransaction } from '../connection.js';

interface FtsJoinedRow {
  entity_type: string;
  entity_id: string;
  title: string;
  content: string | null;
  rank: number;
}

function generateSnippet(text: string | null | undefined, query: string, maxLen = 120): string | undefined {
  if (!text) return undefined;
  const terms = query
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return text.slice(0, maxLen);

  const lower = text.toLowerCase();
  let bestIdx = -1;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx;
    }
  }

  const start = Math.max(0, bestIdx === -1 ? 0 : bestIdx - 30);
  const end = Math.min(text.length, start + maxLen);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  for (const term of terms) {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    snippet = snippet.replace(regex, '<b>$1</b>');
  }

  return snippet;
}

export class SearchRepositoryImpl implements SearchRepository {
  constructor(private readonly db: Database.Database) {}

  private mapScopeToEntityTypes(scope: SearchScope): string[] {
    switch (scope) {
      case 'works':
        return ['work', 'works'];
      case 'memories':
        return ['memory', 'memories'];
      case 'lore':
        return ['lore'];
      case 'lists':
        return ['list', 'lists'];
      default:
        return [scope];
    }
  }

  private mapEntityTypeToScope(entityType: string): SearchScope {
    if (entityType === 'work' || entityType === 'works') return 'works';
    if (entityType === 'memory' || entityType === 'memories') return 'memories';
    if (entityType === 'lore') return 'lore';
    if (entityType === 'list' || entityType === 'lists') return 'lists';
    return 'works';
  }

  async search(
    query: string,
    scopes: readonly SearchScope[] = ['works', 'memories', 'lore', 'lists'],
    vaultUnlocked = false,
  ): Promise<SearchResults> {
    const rawQuery = query.trim();
    if (!rawQuery) {
      return { query, matches: [], totalCount: 0 };
    }

    const cleanTokens = rawQuery
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    // Build entity type filter
    const allowedTypes = new Set<string>();
    for (const s of scopes) {
      for (const t of this.mapScopeToEntityTypes(s)) {
        allowedTypes.add(t);
      }
    }

    const placeholders = Array.from(allowedTypes).map(() => '?').join(',');
    const whereScope = allowedTypes.size > 0 ? `AND l.entity_type IN (${placeholders})` : '';

    let rows: FtsJoinedRow[] = [];

    if (cleanTokens.length > 0) {
      const ftsQuery = cleanTokens.map((t) => `${t}*`).join(' ');
      const sql = `
        SELECT
          l.entity_type,
          l.entity_id,
          l.title,
          l.content,
          s.rank
        FROM search_fts s
        JOIN search_lookup l ON l.rowid = s.rowid
        WHERE s.search_fts MATCH ? ${whereScope}
        ORDER BY s.rank
        LIMIT 100
      `;

      try {
        rows = this.db.prepare(sql).all(ftsQuery, ...Array.from(allowedTypes)) as FtsJoinedRow[];
      } catch {
        rows = [];
      }
    }

    // Fallback: If no FTS matches, query search_lookup with LIKE
    if (rows.length === 0) {
      const likePattern = `%${rawQuery}%`;
      const likeScope = allowedTypes.size > 0 ? `AND entity_type IN (${placeholders})` : '';
      const fallbackSql = `
        SELECT entity_type, entity_id, title, content, 0 as rank
        FROM search_lookup
        WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?) ${likeScope}
        LIMIT 50
      `;
      try {
        rows = this.db.prepare(fallbackSql).all(likePattern, likePattern, likePattern, ...Array.from(allowedTypes)) as FtsJoinedRow[];
      } catch {
        rows = [];
      }
    }

    const matches: SearchMatch[] = rows.map((r) => ({
      entityType: this.mapEntityTypeToScope(r.entity_type),
      entityId: r.entity_id,
      title: r.title,
      snippet: generateSnippet(r.content, rawQuery),
      score: Math.max(0, 100 - Math.abs(r.rank)),
    }));

    // If vault is unlocked and 'works' scope requested, also search vault-encrypted works in database
    if (vaultUnlocked && (scopes.includes('works') || scopes.length === 0)) {
      const likePattern = `%${rawQuery}%`;
      const vaultWorks = this.db
        .prepare(
          `SELECT id, title, description FROM works
           WHERE privacy_state = 'vault' AND deleted_at IS NULL AND (title LIKE ? OR description LIKE ?)
           LIMIT 20`,
        )
        .all(likePattern, likePattern) as Array<{ id: string; title: string; description: string | null }>;

      for (const vw of vaultWorks) {
        if (!matches.some((m) => m.entityId === vw.id)) {
          matches.push({
            entityType: 'works',
            entityId: vw.id,
            title: vw.title,
            snippet: vw.description ? `[Vault] ${vw.description.slice(0, 100)}` : '[Vault item]',
            score: 85,
          });
        }
      }
    }

    return {
      query,
      matches,
      totalCount: matches.length,
    };
  }

  async indexWork(work: Work): Promise<void> {
    runInTransaction(this.db, () => {
      const existing = this.db
        .prepare("SELECT rowid FROM search_lookup WHERE entity_type IN ('work', 'works') AND entity_id = ?")
        .get(work.id) as { rowid: number } | undefined;

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
        const allAliases = [...(work.alternativeTitles ?? []), ...(work.aliases ?? [])].join(' ');
        const allTags = [...(work.genres ?? []), ...(work.tags ?? [])].join(' ');
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
    });
  }

  async indexMemory(memory: Memory): Promise<void> {
    runInTransaction(this.db, () => {
      const existing = this.db
        .prepare("SELECT rowid FROM search_lookup WHERE entity_type IN ('memory', 'memories') AND entity_id = ?")
        .get(memory.id) as { rowid: number } | undefined;

      if (existing) {
        try {
          this.db.prepare('DELETE FROM search_fts WHERE rowid = ?').run(existing.rowid);
        } catch {
          // ignore
        }
        this.db.prepare('DELETE FROM search_lookup WHERE rowid = ?').run(existing.rowid);
      }

      const isPublic = memory.privacyState === ('normal' as any) || memory.privacyState === PrivacyState.Public;
      if (isPublic) {
        const tags = (memory.tags ? [...memory.tags] : []).join(' ');
        const info = this.db
          .prepare(
            `INSERT INTO search_lookup(entity_type, entity_id, title, content, tags)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run('memory', memory.id, memory.title ?? '', memory.body ?? '', tags);

        try {
          this.db
            .prepare(
              `INSERT INTO search_fts(rowid, entity_type, entity_id, title, content, tags)
               VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .run(info.lastInsertRowid, 'memory', memory.id, memory.title ?? '', memory.body ?? '', tags);
        } catch {
          // ignore
        }
      }
    });
  }

  async removeIndex(entityType: SearchScope, entityId: string): Promise<void> {
    const types = this.mapScopeToEntityTypes(entityType);
    const placeholders = types.map(() => '?').join(',');

    runInTransaction(this.db, () => {
      const rows = this.db
        .prepare(`SELECT rowid FROM search_lookup WHERE entity_type IN (${placeholders}) AND entity_id = ?`)
        .all(...types, entityId) as Array<{ rowid: number }>;

      for (const r of rows) {
        try {
          this.db.prepare('DELETE FROM search_fts WHERE rowid = ?').run(r.rowid);
        } catch {
          // ignore
        }
      }
      this.db
        .prepare(`DELETE FROM search_lookup WHERE entity_type IN (${placeholders}) AND entity_id = ?`)
        .run(...types, entityId);
    });
  }

  async rebuildIndex(): Promise<void> {
    runInTransaction(this.db, () => {
      try {
        this.db.prepare('DELETE FROM search_fts').run();
      } catch {
        // ignore
      }
      this.db.prepare('DELETE FROM search_lookup').run();

      // Index all public works
      const works = this.db
        .prepare(`SELECT * FROM works WHERE deleted_at IS NULL AND privacy_state = 'public'`)
        .all() as Array<{ id: string; title: string; description: string | null }>;

      const insertLookup = this.db.prepare(
        'INSERT INTO search_lookup(entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)',
      );
      const insertFts = this.db.prepare(
        'INSERT INTO search_fts(rowid, entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?, ?)',
      );

      for (const w of works) {
        const aliases = (
          this.db.prepare('SELECT alias FROM work_aliases WHERE work_id = ?').all(w.id) as Array<{ alias: string }>
        )
          .map((a) => a.alias)
          .join(' ');

        const tags = (
          this.db.prepare('SELECT tag FROM work_tags WHERE work_id = ?').all(w.id) as Array<{ tag: string }>
        )
          .map((t) => t.tag)
          .join(' ');

        const genres = (
          this.db.prepare('SELECT genre FROM work_genres WHERE work_id = ?').all(w.id) as Array<{ genre: string }>
        )
          .map((g) => g.genre)
          .join(' ');

        const content = [w.description ?? '', aliases].filter(Boolean).join(' ');
        const allTags = [genres, tags].filter(Boolean).join(' ');

        const info = insertLookup.run('work', w.id, w.title, content, allTags);
        try {
          insertFts.run(info.lastInsertRowid, 'work', w.id, w.title, content, allTags);
        } catch {
          // ignore
        }
      }

      // Index all public memories
      const memories = this.db
        .prepare(`SELECT * FROM memories WHERE privacy_state IN ('normal', 'public')`)
        .all() as Array<{ id: string; title: string | null; body: string | null }>;

      for (const m of memories) {
        const tags = (
          this.db.prepare('SELECT tag FROM memory_tags WHERE memory_id = ?').all(m.id) as Array<{ tag: string }>
        )
          .map((t) => t.tag)
          .join(' ');

        const info = insertLookup.run('memory', m.id, m.title ?? '', m.body ?? '', tags);
        try {
          insertFts.run(info.lastInsertRowid, 'memory', m.id, m.title ?? '', m.body ?? '', tags);
        } catch {
          // ignore
        }
      }
    });
  }
}
