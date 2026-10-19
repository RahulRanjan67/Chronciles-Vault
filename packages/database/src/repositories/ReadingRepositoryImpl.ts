/**
 * ReadingRepositoryImpl - SQLite implementation of ReadingRepository using better-sqlite3.
 *
 * Handles reading relationships, attempts, sessions, and progress events.
 * Anchors are safely serialized/deserialized as JSON.
 */

import type Database from 'better-sqlite3';
import {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  ReadingAttemptId,
  ReadingSessionId,
  type ReadingRelationship,
  type ReadingAttempt,
  type ReadingSession,
  type ProgressEvent,
  type ProgressAnchor,
  PersonalState,
  ReadingPriority,
  ProgressMethod,
  ProgressConfidence,
  type ReadingRepository,
  type ReadingListFilter,
} from '@grimoire/domain';
import { runInTransaction } from '../connection.js';

interface ReadingRelationshipRow {
  id: string;
  work_id: string;
  personal_state: string;
  priority: string;
  started_at: string | null;
  last_active_at: string | null;
  completed_at: string | null;
  stopped_at: string | null;
  stopped_reason: string | null;
  stopped_note: string | null;
  created_at: string;
  updated_at: string;
}

interface ReadingAttemptRow {
  id: string;
  work_id: string;
  reading_relationship_id: string;
  attempt_number: number;
  started_at: string;
  ended_at: string | null;
  final_anchor: string | null;
  notes: string | null;
  created_at: string;
}

interface ReadingSessionRow {
  id: string;
  work_id: string;
  reading_relationship_id: string;
  access_path_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  anchor_before: string | null;
  anchor_after: string | null;
  created_at: string;
}

interface ProgressEventRow {
  id: string;
  work_id: string;
  reading_relationship_id: string | null;
  access_path_id: string | null;
  method: string;
  confidence: string;
  anchor_before: string | null;
  anchor_after: string;
  provenance_note: string | null;
  created_at: string;
}

function parseAnchor(raw: string | null | undefined): ProgressAnchor | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProgressAnchor;
  } catch {
    return null;
  }
}

function serializeAnchor(anchor: ProgressAnchor | null | undefined): string | null {
  if (!anchor) return null;
  return JSON.stringify(anchor);
}

export class ReadingRepositoryImpl implements ReadingRepository {
  constructor(private readonly db: Database.Database) {}

  private mapRelationship(row: ReadingRelationshipRow): ReadingRelationship {
    // Look up preferred access path
    const prefRow = this.db
      .prepare('SELECT id FROM access_paths WHERE work_id = ? AND is_preferred = 1 LIMIT 1')
      .get(row.work_id) as { id: string } | undefined;

    // Look up current anchor from latest progress event
    const latestProgress = this.db
      .prepare(
        'SELECT anchor_after FROM progress_events WHERE work_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',
      )
      .get(row.work_id) as { anchor_after: string } | undefined;

    return {
      id: row.id as ReadingRelationshipId,
      workId: row.work_id as WorkId,
      personalState: row.personal_state as PersonalState,
      priority: row.priority as ReadingPriority,
      startedAt: row.started_at,
      lastActiveAt: row.last_active_at,
      completedAt: row.completed_at,
      stoppedAt: row.stopped_at,
      stoppedReason: row.stopped_reason,
      stoppedNote: row.stopped_note,
      currentAnchor: latestProgress ? parseAnchor(latestProgress.anchor_after) : null,
      preferredAccessPathId: prefRow ? (prefRow.id as AccessPathId) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getRelationship(workId: WorkId): Promise<ReadingRelationship | null> {
    const row = this.db
      .prepare('SELECT * FROM reading_relationships WHERE work_id = ?')
      .get(workId) as ReadingRelationshipRow | undefined;

    if (!row) return null;
    return this.mapRelationship(row);
  }

  async upsertRelationship(rel: ReadingRelationship): Promise<ReadingRelationship> {
    return runInTransaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO reading_relationships (
            id, work_id, personal_state, priority, started_at,
            last_active_at, completed_at, stopped_at, stopped_reason,
            stopped_note, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(work_id) DO UPDATE SET
            personal_state = excluded.personal_state,
            priority = excluded.priority,
            started_at = excluded.started_at,
            last_active_at = excluded.last_active_at,
            completed_at = excluded.completed_at,
            stopped_at = excluded.stopped_at,
            stopped_reason = excluded.stopped_reason,
            stopped_note = excluded.stopped_note,
            updated_at = excluded.updated_at`,
        )
        .run(
          rel.id,
          rel.workId,
          rel.personalState,
          rel.priority,
          rel.startedAt ?? null,
          rel.lastActiveAt ?? null,
          rel.completedAt ?? null,
          rel.stoppedAt ?? null,
          rel.stoppedReason ?? null,
          rel.stoppedNote ?? null,
          rel.createdAt,
          rel.updatedAt,
        );

      // If currentAnchor is provided and not already matching latest progress event, record it
      if (rel.currentAnchor) {
        const latest = this.db
          .prepare(
            'SELECT anchor_after FROM progress_events WHERE work_id = ? ORDER BY created_at DESC LIMIT 1',
          )
          .get(rel.workId) as { anchor_after: string } | undefined;

        const serialized = serializeAnchor(rel.currentAnchor);
        if (!latest || latest.anchor_after !== serialized) {
          const eventTime = rel.updatedAt ?? rel.lastActiveAt ?? rel.createdAt ?? new Date().toISOString();
          this.db
            .prepare(
              `INSERT INTO progress_events (
                id, work_id, reading_relationship_id, method,
                confidence, anchor_after, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              crypto.randomUUID(),
              rel.workId,
              rel.id,
              ProgressMethod.Manual,
              ProgressConfidence.Confirmed,
              serialized,
              eventTime,
            );
        }
      }

      // If preferred access path is specified, update access_paths
      if (rel.preferredAccessPathId) {
        this.db.prepare('UPDATE access_paths SET is_preferred = 0 WHERE work_id = ?').run(rel.workId);
        this.db
          .prepare('UPDATE access_paths SET is_preferred = 1 WHERE id = ? AND work_id = ?')
          .run(rel.preferredAccessPathId, rel.workId);
      }

      const fresh = this.db
        .prepare('SELECT * FROM reading_relationships WHERE work_id = ?')
        .get(rel.workId) as ReadingRelationshipRow;

      return this.mapRelationship(fresh);
    });
  }

  async recordProgress(event: ProgressEvent): Promise<ProgressEvent> {
    return runInTransaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO progress_events (
            id, work_id, reading_relationship_id, access_path_id,
            method, confidence, anchor_before, anchor_after,
            provenance_note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          event.id,
          event.workId,
          event.readingRelationshipId ?? null,
          event.accessPathId ?? null,
          event.method,
          event.confidence,
          serializeAnchor(event.anchorBefore),
          serializeAnchor(event.anchorAfter)!,
          event.provenanceNote ?? null,
          event.createdAt,
        );

      // Update reading relationship last_active_at
      this.db
        .prepare(
          `UPDATE reading_relationships
           SET last_active_at = ?,
               started_at = COALESCE(started_at, ?),
               updated_at = ?
           WHERE work_id = ?`,
        )
        .run(event.createdAt, event.createdAt, event.createdAt, event.workId);

      return event;
    });
  }

  async getProgressHistory(workId: WorkId, limit = 50): Promise<readonly ProgressEvent[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM progress_events
         WHERE work_id = ?
         ORDER BY created_at DESC, rowid DESC
         LIMIT ?`,
      )
      .all(workId, limit) as ProgressEventRow[];

    return rows.map((r) => ({
      id: r.id,
      workId: r.work_id as WorkId,
      readingRelationshipId: r.reading_relationship_id as ReadingRelationshipId | undefined,
      accessPathId: r.access_path_id as AccessPathId | undefined,
      method: r.method as ProgressMethod,
      confidence: r.confidence as ProgressConfidence,
      anchorBefore: parseAnchor(r.anchor_before),
      anchorAfter: parseAnchor(r.anchor_after)!,
      provenanceNote: r.provenance_note ?? undefined,
      createdAt: r.created_at,
    }));
  }

  async getAttempts(workId: WorkId): Promise<readonly ReadingAttempt[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM reading_attempts
         WHERE work_id = ?
         ORDER BY attempt_number ASC`,
      )
      .all(workId) as ReadingAttemptRow[];

    return rows.map((r) => ({
      id: r.id as ReadingAttemptId,
      workId: r.work_id as WorkId,
      readingRelationshipId: r.reading_relationship_id as ReadingRelationshipId,
      attemptNumber: r.attempt_number,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      finalAnchor: parseAnchor(r.final_anchor),
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async createAttempt(attempt: ReadingAttempt): Promise<ReadingAttempt> {
    this.db
      .prepare(
        `INSERT INTO reading_attempts (
          id, work_id, reading_relationship_id, attempt_number,
          started_at, ended_at, final_anchor, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        attempt.id,
        attempt.workId,
        attempt.readingRelationshipId,
        attempt.attemptNumber,
        attempt.startedAt,
        attempt.endedAt ?? null,
        serializeAnchor(attempt.finalAnchor),
        attempt.notes ?? null,
        attempt.createdAt,
      );

    return attempt;
  }

  async recordSession(session: ReadingSession): Promise<ReadingSession> {
    return runInTransaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO reading_sessions (
            id, work_id, reading_relationship_id, access_path_id,
            started_at, ended_at, duration_seconds,
            anchor_before, anchor_after, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          session.id,
          session.workId,
          session.readingRelationshipId,
          session.accessPathId ?? null,
          session.startedAt,
          session.endedAt ?? null,
          session.durationSeconds ?? null,
          serializeAnchor(session.anchorBefore),
          serializeAnchor(session.anchorAfter),
          session.createdAt,
        );

      // If anchorAfter exists, also log a progress event if it progressed
      if (session.anchorAfter) {
        this.db
          .prepare(
            `INSERT INTO progress_events (
              id, work_id, reading_relationship_id, access_path_id,
              method, confidence, anchor_before, anchor_after, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            crypto.randomUUID(),
            session.workId,
            session.readingRelationshipId,
            session.accessPathId ?? null,
            ProgressMethod.Reader,
            ProgressConfidence.Confirmed,
            serializeAnchor(session.anchorBefore),
            serializeAnchor(session.anchorAfter)!,
            session.endedAt ?? session.startedAt,
          );
      }

      // Update last_active_at
      this.db
        .prepare('UPDATE reading_relationships SET last_active_at = ?, updated_at = ? WHERE id = ?')
        .run(session.endedAt ?? session.startedAt, new Date().toISOString(), session.readingRelationshipId);

      return session;
    });
  }

  async getSessions(workId: WorkId, limit = 50): Promise<readonly ReadingSession[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM reading_sessions
         WHERE work_id = ?
         ORDER BY started_at DESC
         LIMIT ?`,
      )
      .all(workId, limit) as ReadingSessionRow[];

    return rows.map((r) => ({
      id: r.id as ReadingSessionId,
      workId: r.work_id as WorkId,
      readingRelationshipId: r.reading_relationship_id as ReadingRelationshipId,
      accessPathId: r.access_path_id ? (r.access_path_id as AccessPathId) : null,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSeconds: r.duration_seconds,
      anchorBefore: parseAnchor(r.anchor_before),
      anchorAfter: parseAnchor(r.anchor_after),
      createdAt: r.created_at,
    }));
  }

  async listRelationships(filter?: ReadingListFilter): Promise<readonly ReadingRelationship[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter?.personalStates && filter.personalStates.length > 0) {
      const placeholders = filter.personalStates.map(() => '?').join(',');
      conditions.push(`personal_state IN (${placeholders})`);
      params.push(...filter.personalStates);
    }

    if (filter?.priorities && filter.priorities.length > 0) {
      const placeholders = filter.priorities.map(() => '?').join(',');
      conditions.push(`priority IN (${placeholders})`);
      params.push(...filter.priorities);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM reading_relationships ${where} ORDER BY last_active_at DESC`;

    const rows = this.db.prepare(sql).all(...params) as ReadingRelationshipRow[];
    return rows.map((r) => this.mapRelationship(r));
  }
}
