/**
 * CaptureRepositoryImpl - SQLite implementation of CaptureRepository using better-sqlite3.
 *
 * Implements capture ingestion, batch management, URL matching, and state transitions.
 */

import type Database from 'better-sqlite3';
import {
  WorkId,
  CaptureId,
  CaptureBatchId,
  type Capture,
  type CaptureBatch,
  CaptureState,
  CaptureSource,
  type CaptureRepository,
} from '@chronicles-vault/domain';
import { runInTransaction } from '../connection.js';

interface CaptureRow {
  id: string;
  batch_id: string | null;
  url: string | null;
  normalized_url: string | null;
  title: string | null;
  favicon_ref: string | null;
  browser: string | null;
  window_label: string | null;
  captured_at: string;
  possible_work_id: string | null;
  confidence_score: number | null;
  state: string;
  created_at: string;
}

interface BatchRow {
  id: string;
  label: string | null;
  source: string;
  item_count: number;
  processed_count: number;
  created_at: string;
}

export class CaptureRepositoryImpl implements CaptureRepository {
  constructor(private readonly db: Database.Database) {}

  private mapCapture(row: CaptureRow): Capture {
    return {
      id: row.id as CaptureId,
      batchId: row.batch_id ? (row.batch_id as CaptureBatchId) : null,
      url: row.url,
      normalizedUrl: row.normalized_url,
      title: row.title,
      faviconRef: row.favicon_ref,
      browser: row.browser,
      windowLabel: row.window_label,
      capturedAt: row.captured_at,
      possibleWorkId: row.possible_work_id ? (row.possible_work_id as WorkId) : null,
      confidenceScore: row.confidence_score,
      state: row.state as CaptureState,
      createdAt: row.created_at,
    };
  }

  private mapBatch(row: BatchRow): CaptureBatch {
    return {
      id: row.id as CaptureBatchId,
      label: row.label,
      source: row.source as CaptureSource,
      itemCount: row.item_count,
      processedCount: row.processed_count,
      createdAt: row.created_at,
    };
  }

  async createBatch(batch: CaptureBatch): Promise<CaptureBatch> {
    this.db
      .prepare(
        `INSERT INTO capture_batches (id, label, source, item_count, processed_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(batch.id, batch.label ?? null, batch.source, batch.itemCount, batch.processedCount, batch.createdAt);

    return batch;
  }

  async addItems(batchId: CaptureBatchId, items: readonly Capture[]): Promise<readonly Capture[]> {
    return runInTransaction(this.db, () => {
      const insert = this.db.prepare(
        `INSERT INTO captures (
          id, batch_id, url, normalized_url, title,
          favicon_ref, browser, window_label, captured_at,
          possible_work_id, confidence_score, state, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );

      for (const item of items) {
        insert.run(
          item.id,
          batchId,
          item.url ?? null,
          item.normalizedUrl ?? null,
          item.title ?? null,
          item.faviconRef ?? null,
          item.browser ?? null,
          item.windowLabel ?? null,
          item.capturedAt,
          item.possibleWorkId ?? null,
          item.confidenceScore ?? null,
          item.state,
          item.createdAt,
        );
      }

      // Update item count on the batch
      this.db
        .prepare('UPDATE capture_batches SET item_count = item_count + ? WHERE id = ?')
        .run(items.length, batchId);

      return items;
    });
  }

  async listPending(limit = 100): Promise<readonly Capture[]> {
    const rows = this.db
      .prepare('SELECT * FROM captures WHERE state = ? ORDER BY captured_at DESC LIMIT ?')
      .all(CaptureState.Pending, limit) as CaptureRow[];

    return rows.map((r) => this.mapCapture(r));
  }

  async updateState(id: CaptureId, state: CaptureState, workId?: WorkId | null): Promise<void> {
    runInTransaction(this.db, () => {
      const current = this.db.prepare('SELECT batch_id, state FROM captures WHERE id = ?').get(id) as
        | { batch_id: string | null; state: string }
        | undefined;

      if (!current) return;

      if (workId !== undefined) {
        this.db
          .prepare('UPDATE captures SET state = ?, possible_work_id = ? WHERE id = ?')
          .run(state, workId, id);
      } else {
        this.db.prepare('UPDATE captures SET state = ? WHERE id = ?').run(state, id);
      }

      // If transition from pending to non-pending, increment processed_count on batch
      if (current.state === CaptureState.Pending && state !== CaptureState.Pending && current.batch_id) {
        this.db
          .prepare('UPDATE capture_batches SET processed_count = processed_count + 1 WHERE id = ?')
          .run(current.batch_id);
      }
    });
  }

  async getBatch(batchId: CaptureBatchId): Promise<CaptureBatch | null> {
    const row = this.db.prepare('SELECT * FROM capture_batches WHERE id = ?').get(batchId) as BatchRow | undefined;
    if (!row) return null;
    return this.mapBatch(row);
  }

  async findById(id: CaptureId): Promise<Capture | null> {
    const row = this.db.prepare('SELECT * FROM captures WHERE id = ?').get(id) as CaptureRow | undefined;
    if (!row) return null;
    return this.mapCapture(row);
  }

  async findByBatchId(batchId: CaptureBatchId): Promise<Capture[]> {
    const rows = this.db
      .prepare('SELECT * FROM captures WHERE batch_id = ? ORDER BY captured_at DESC')
      .all(batchId) as CaptureRow[];
    return rows.map((r) => this.mapCapture(r));
  }

  async findByState(state: CaptureState): Promise<Capture[]> {
    const rows = this.db
      .prepare('SELECT * FROM captures WHERE state = ? ORDER BY captured_at DESC')
      .all(state) as CaptureRow[];
    return rows.map((r) => this.mapCapture(r));
  }

  async findByUrl(normalizedUrl: string): Promise<Capture | null> {
    const row = this.db
      .prepare('SELECT * FROM captures WHERE normalized_url = ? ORDER BY captured_at DESC LIMIT 1')
      .get(normalizedUrl) as CaptureRow | undefined;
    if (!row) return null;
    return this.mapCapture(row);
  }

  async save(capture: Capture): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO captures (
          id, batch_id, url, normalized_url, title,
          favicon_ref, browser, window_label, captured_at,
          possible_work_id, confidence_score, state, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          state = excluded.state,
          possible_work_id = excluded.possible_work_id,
          confidence_score = excluded.confidence_score`,
      )
      .run(
        capture.id,
        capture.batchId ?? null,
        capture.url ?? null,
        capture.normalizedUrl ?? null,
        capture.title ?? null,
        capture.faviconRef ?? null,
        capture.browser ?? null,
        capture.windowLabel ?? null,
        capture.capturedAt,
        capture.possibleWorkId ?? null,
        capture.confidenceScore ?? null,
        capture.state,
        capture.createdAt,
      );
  }

  async delete(id: CaptureId): Promise<void> {
    this.db.prepare('DELETE FROM captures WHERE id = ?').run(id);
  }

  async listBatches(): Promise<CaptureBatch[]> {
    const rows = this.db.prepare('SELECT * FROM capture_batches ORDER BY created_at DESC').all() as BatchRow[];
    return rows.map((r) => this.mapBatch(r));
  }

  async deleteBatch(id: CaptureBatchId): Promise<void> {
    runInTransaction(this.db, () => {
      this.db.prepare('DELETE FROM captures WHERE batch_id = ?').run(id);
      this.db.prepare('DELETE FROM capture_batches WHERE id = ?').run(id);
    });
  }
}
