/**
 * MemoryRepositoryImpl - SQLite implementation of MemoryRepository using better-sqlite3.
 *
 * Implements memories, assets, tags, gallery filtering, and FTS5 search synchronization.
 */

import type Database from 'better-sqlite3';
import {
  WorkId,
  MemoryId,
  MemoryAssetId,
  AccessPathId,
  newId,
  type Memory,
  type MemoryAsset,
  type ProgressAnchor,
  MemoryType,
  SpoilerLevel,
  PrivacyState,
  type MemoryRepository,
  type MemoryListOptions,
  type GlobalMemoryOptions,
} from '@grimoire/domain';
import { runInTransaction } from '../connection.js';

interface MemoryRow {
  id: string;
  work_id: string | null;
  type: string;
  title: string | null;
  body: string | null;
  privacy_state: string;
  spoiler_level: string;
  show_in_global_gallery: number;
  access_path_id: string | null;
  progress_anchor: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetRow {
  id: string;
  memory_id: string;
  asset_type: string;
  file_id: string;
  thumbnail_ref: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

interface TagRow {
  memory_id: string;
  tag: string;
}

export class MemoryRepositoryImpl implements MemoryRepository {
  constructor(private readonly db: Database.Database) {}

  private syncFts(memory: Memory, tags: string[] = []): void {
    this.db.prepare('DELETE FROM search_fts WHERE entity_type = ? AND entity_id = ?').run('memory', memory.id);

    // Only index non-vault / public/normal memories
    const isPublic = memory.privacyState === ('normal' as unknown) || memory.privacyState === PrivacyState.Public;
    if (isPublic) {
      this.db
        .prepare(
          `INSERT INTO search_fts(entity_type, entity_id, title, content, tags)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run('memory', memory.id, memory.title ?? '', memory.body ?? '', tags.join(' '));
    }
  }

  private hydrateMemories(rows: MemoryRow[]): Memory[] {
    if (rows.length === 0) return [];

    const memoryIds = rows.map((r) => r.id);
    const placeholders = memoryIds.map(() => '?').join(',');

    const assets = this.db
      .prepare(`SELECT * FROM memory_assets WHERE memory_id IN (${placeholders}) ORDER BY created_at ASC`)
      .all(...memoryIds) as AssetRow[];

    const tags = this.db
      .prepare(`SELECT * FROM memory_tags WHERE memory_id IN (${placeholders})`)
      .all(...memoryIds) as TagRow[];

    const assetMap = new Map<string, MemoryAsset[]>();
    for (const a of assets) {
      const list = assetMap.get(a.memory_id) ?? [];
      list.push({
        id: a.id as MemoryAssetId,
        memoryId: a.memory_id as MemoryId,
        assetType: a.asset_type as any,
        fileId: a.file_id,
        thumbnailRef: a.thumbnail_ref,
        width: a.width,
        height: a.height,
        createdAt: a.created_at,
      });
      assetMap.set(a.memory_id, list);
    }

    const tagMap = new Map<string, string[]>();
    for (const t of tags) {
      const list = tagMap.get(t.memory_id) ?? [];
      list.push(t.tag);
      tagMap.set(t.memory_id, list);
    }

    return rows.map((r) => {
      let anchor: ProgressAnchor | null = null;
      if (r.progress_anchor) {
        try {
          anchor = JSON.parse(r.progress_anchor);
        } catch {
          // ignore
        }
      }

      return {
        id: r.id as MemoryId,
        workId: r.work_id ? (r.work_id as WorkId) : null,
        type: r.type as MemoryType,
        title: r.title,
        body: r.body,
        privacyState: r.privacy_state as any,
        spoilerLevel: r.spoiler_level as SpoilerLevel,
        showInGlobalGallery: r.show_in_global_gallery === 1,
        accessPathId: r.access_path_id ? (r.access_path_id as AccessPathId) : null,
        progressAnchor: anchor,
        assets: assetMap.get(r.id) ?? [],
        tags: tagMap.get(r.id) ?? [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  async create(memory: Memory): Promise<Memory> {
    return runInTransaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO memories (
            id, work_id, type, title, body,
            privacy_state, spoiler_level, show_in_global_gallery,
            access_path_id, progress_anchor, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          memory.id,
          memory.workId ?? null,
          memory.type,
          memory.title ?? null,
          memory.body ?? null,
          memory.privacyState,
          memory.spoilerLevel,
          memory.showInGlobalGallery ? 1 : 0,
          memory.accessPathId ?? null,
          memory.progressAnchor ? JSON.stringify(memory.progressAnchor) : null,
          memory.createdAt,
          memory.updatedAt,
        );

      // Insert assets if any
      if (memory.assets && memory.assets.length > 0) {
        const insertAsset = this.db.prepare(
          `INSERT INTO memory_assets (id, memory_id, asset_type, file_id, thumbnail_ref, width, height, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const a of memory.assets) {
          insertAsset.run(a.id, memory.id, a.assetType, a.fileId, a.thumbnailRef ?? null, a.width ?? null, a.height ?? null, a.createdAt);
        }
      }

      // Insert tags if any
      const tagList = memory.tags ? [...memory.tags] : [];
      if (tagList.length > 0) {
        const insertTag = this.db.prepare('INSERT OR IGNORE INTO memory_tags (memory_id, tag) VALUES (?, ?)');
        for (const t of tagList) {
          insertTag.run(memory.id, t);
        }
      }

      this.syncFts(memory, tagList);
      return memory;
    });
  }

  async getById(id: MemoryId): Promise<Memory | null> {
    const row = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | undefined;
    if (!row) return null;
    const [hydrated] = this.hydrateMemories([row]);
    return hydrated ?? null;
  }

  async listByWork(workId: WorkId, options: MemoryListOptions = {}): Promise<readonly Memory[]> {
    const conditions: string[] = ['work_id = ?'];
    const params: unknown[] = [workId];

    if (options.types && options.types.length > 0) {
      const placeholders = options.types.map(() => '?').join(',');
      conditions.push(`type IN (${placeholders})`);
      params.push(...options.types);
    }

    if (options.spoilerLevels && options.spoilerLevels.length > 0) {
      const placeholders = options.spoilerLevels.map(() => '?').join(',');
      conditions.push(`spoiler_level IN (${placeholders})`);
      params.push(...options.spoilerLevels);
    }

    if (options.privacyStates && options.privacyStates.length > 0) {
      const placeholders = options.privacyStates.map(() => '?').join(',');
      conditions.push(`privacy_state IN (${placeholders})`);
      params.push(...options.privacyStates);
    }

    if (options.tags && options.tags.length > 0) {
      const placeholders = options.tags.map(() => '?').join(',');
      conditions.push(`id IN (SELECT memory_id FROM memory_tags WHERE tag IN (${placeholders}))`);
      params.push(...options.tags);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const sql = `SELECT * FROM memories ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = this.db.prepare(sql).all(...params, limit, offset) as MemoryRow[];
    return this.hydrateMemories(rows);
  }

  async listGlobal(options: GlobalMemoryOptions = {}): Promise<readonly Memory[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.onlyGallery ?? true) {
      conditions.push('show_in_global_gallery = 1');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const sql = `SELECT * FROM memories ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = this.db.prepare(sql).all(...params, limit, offset) as MemoryRow[];
    return this.hydrateMemories(rows);
  }

  async update(id: MemoryId, patch: Partial<Memory>): Promise<Memory> {
    return runInTransaction(this.db, () => {
      const existing = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | undefined;
      if (!existing) {
        throw new Error(`Memory with id ${id} not found`);
      }

      const now = new Date().toISOString();
      const title = patch.title !== undefined ? patch.title : existing.title;
      const body = patch.body !== undefined ? patch.body : existing.body;
      const type = patch.type ?? existing.type;
      const privacy = patch.privacyState ?? existing.privacy_state;
      const spoiler = patch.spoilerLevel ?? existing.spoiler_level;
      const gallery = patch.showInGlobalGallery !== undefined ? (patch.showInGlobalGallery ? 1 : 0) : existing.show_in_global_gallery;
      const accessPath = patch.accessPathId !== undefined ? patch.accessPathId : existing.access_path_id;
      const anchor = patch.progressAnchor !== undefined ? (patch.progressAnchor ? JSON.stringify(patch.progressAnchor) : null) : existing.progress_anchor;

      this.db
        .prepare(
          `UPDATE memories SET
            title = ?, body = ?, type = ?, privacy_state = ?,
            spoiler_level = ?, show_in_global_gallery = ?,
            access_path_id = ?, progress_anchor = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(title, body, type, privacy, spoiler, gallery, accessPath, anchor, now, id);

      if (patch.tags !== undefined) {
        this.db.prepare('DELETE FROM memory_tags WHERE memory_id = ?').run(id);
        const insertTag = this.db.prepare('INSERT OR IGNORE INTO memory_tags (memory_id, tag) VALUES (?, ?)');
        for (const t of patch.tags) {
          insertTag.run(id, t);
        }
      }

      const freshRow = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow;
      const [hydrated] = this.hydrateMemories([freshRow]);
      if (!hydrated) throw new Error('Failed to hydrate memory after update');

      this.syncFts(hydrated, hydrated.tags ? [...hydrated.tags] : []);
      return hydrated;
    });
  }

  async delete(id: MemoryId): Promise<void> {
    runInTransaction(this.db, () => {
      this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
      this.db.prepare('DELETE FROM search_fts WHERE entity_type = ? AND entity_id = ?').run('memory', id);
    });
  }

  async getAssets(memoryId: MemoryId): Promise<MemoryAsset[]> {
    const rows = this.db
      .prepare('SELECT * FROM memory_assets WHERE memory_id = ? ORDER BY created_at ASC')
      .all(memoryId) as AssetRow[];

    return rows.map((a) => ({
      id: a.id as MemoryAssetId,
      memoryId: a.memory_id as MemoryId,
      assetType: a.asset_type as any,
      fileId: a.file_id,
      thumbnailRef: a.thumbnail_ref,
      width: a.width,
      height: a.height,
      createdAt: a.created_at,
    }));
  }

  async addAsset(asset: MemoryAsset): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO memory_assets (id, memory_id, asset_type, file_id, thumbnail_ref, width, height, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(asset.id, asset.memoryId, asset.assetType, asset.fileId, asset.thumbnailRef ?? null, asset.width ?? null, asset.height ?? null, asset.createdAt);
  }

  async deleteAsset(assetId: MemoryAssetId): Promise<void> {
    this.db.prepare('DELETE FROM memory_assets WHERE id = ?').run(assetId);
  }

  async getTags(memoryId: MemoryId): Promise<string[]> {
    const rows = this.db.prepare('SELECT tag FROM memory_tags WHERE memory_id = ?').all(memoryId) as TagRow[];
    return rows.map((r) => r.tag);
  }

  async setTags(memoryId: MemoryId, tags: readonly string[]): Promise<void> {
    runInTransaction(this.db, () => {
      this.db.prepare('DELETE FROM memory_tags WHERE memory_id = ?').run(memoryId);
      const insert = this.db.prepare('INSERT OR IGNORE INTO memory_tags (memory_id, tag) VALUES (?, ?)');
      for (const t of tags) {
        insert.run(memoryId, t);
      }

      const memory = this.getById(memoryId);
      memory.then((m) => {
        if (m) this.syncFts(m, [...tags]);
      });
    });
  }

  async getAllTags(): Promise<string[]> {
    const rows = this.db
      .prepare('SELECT DISTINCT tag FROM memory_tags ORDER BY tag COLLATE NOCASE ASC')
      .all() as TagRow[];
    return rows.map((r) => r.tag);
  }
}
