/**
 * UpdateRepositoryImpl - SQLite implementation of UpdateRepository using better-sqlite3.
 *
 * Tracks newly detected chapters/episodes/volumes for works.
 */

import type Database from 'better-sqlite3';
import {
  WorkId,
  newId,
  type UpdateEntry,
  UpdateCertainty,
  type UpdateRepository,
} from '@chronicles-vault/domain';
import { runInTransaction } from '../connection.js';

interface UpdateEntryRow {
  id: string;
  work_id: string;
  access_path_id: string | null;
  anchor: string;
  certainty: string;
  source: string | null;
  detected_at: string;
  published_at: string | null;
}

export class UpdateRepositoryImpl implements UpdateRepository {
  constructor(private readonly db: Database.Database) {}

  private mapRow(row: UpdateEntryRow): UpdateEntry {
    let anchorObj: any = {};
    try {
      anchorObj = JSON.parse(row.anchor);
    } catch {
      // fallback
    }

    const label = anchorObj.label || (anchorObj.chapter ? `Chapter ${anchorObj.chapter}` : 'Update');
    const numericIndex = anchorObj.chapter ?? anchorObj.episode ?? anchorObj.volume ?? undefined;

    return {
      workId: row.work_id as WorkId,
      label,
      certainty: (row.certainty as UpdateCertainty) || UpdateCertainty.Unknown,
      numericIndex,
      sourceUrl: row.source ?? undefined,
      releaseDate: row.published_at ?? undefined,
      detectedAt: row.detected_at,
    };
  }

  async addUpdates(updates: readonly UpdateEntry[]): Promise<void> {
    if (updates.length === 0) return;

    runInTransaction(this.db, () => {
      const insert = this.db.prepare(
        `INSERT INTO update_entries (
          id, work_id, access_path_id, anchor, certainty,
          source, detected_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      );

      for (const u of updates) {
        if (!u.workId) continue;

        const anchor = JSON.stringify({
          type: 'chapter',
          chapter: u.numericIndex,
          label: u.label,
        });

        insert.run(
          newId(),
          u.workId,
          null,
          anchor,
          u.certainty,
          u.sourceUrl ?? null,
          u.detectedAt,
          u.releaseDate ?? null,
        );
      }
    });
  }

  async getUpdatesByWork(workId: WorkId): Promise<readonly UpdateEntry[]> {
    const rows = this.db
      .prepare('SELECT * FROM update_entries WHERE work_id = ? ORDER BY detected_at DESC')
      .all(workId) as UpdateEntryRow[];

    return rows.map((r) => this.mapRow(r));
  }

  async getRecentUpdates(limit = 50): Promise<readonly UpdateEntry[]> {
    const rows = this.db
      .prepare('SELECT * FROM update_entries ORDER BY detected_at DESC LIMIT ?')
      .all(limit) as UpdateEntryRow[];

    return rows.map((r) => this.mapRow(r));
  }

  async clearUpdates(workId: WorkId): Promise<void> {
    this.db.prepare('DELETE FROM update_entries WHERE work_id = ?').run(workId);
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM update_entries WHERE id = ?').run(id);
  }
}
