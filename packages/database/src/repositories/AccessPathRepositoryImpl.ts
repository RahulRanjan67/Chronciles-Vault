/**
 * AccessPathRepositoryImpl - SQLite implementation of AccessPathRepository using better-sqlite3.
 *
 * Supports Web, LocalFile, Feed, and ManualReference access paths, source capabilities,
 * and source health event logging.
 */

import type Database from 'better-sqlite3';
import {
  WorkId,
  AccessPathId,
  type AccessPath,
  type WebAccessPath,
  type LocalFileAccessPath,
  type FeedAccessPath,
  type ManualReferenceAccessPath,
  AccessPathKind,
  AccessCapability,
  SourceHealth,
  type SourceCapability,
  SourceCapabilityStatus,
  type SourceHealthEvent,
  type AccessPathRepository,
} from '@grimoire/domain';
import { runInTransaction } from '../connection.js';

interface AccessPathRow {
  id: string;
  work_id: string;
  kind: string;
  provider: string | null;
  label: string | null;
  url: string | null;
  file_id: string | null;
  is_preferred: number;
  health_state: string;
  last_checked_at: string | null;
  last_opened_at: string | null;
  provenance: string | null;
  created_at: string;
  updated_at: string;
}

interface CapabilityRow {
  access_path_id: string;
  capability: string;
  status: string;
}

interface HealthEventRow {
  id: string;
  access_path_id: string;
  health_state: string;
  checked_at: string;
  error_message: string | null;
}

export class AccessPathRepositoryImpl implements AccessPathRepository {
  constructor(private readonly db: Database.Database) {}

  private mapPath(row: AccessPathRow, capabilities: AccessCapability[] = []): AccessPath {
    const health = (row.health_state as SourceHealth) || SourceHealth.Unknown;
    const isPreferred = row.is_preferred === 1;
    const provenance = row.provenance ? JSON.parse(row.provenance) : null;

    const base = {
      id: row.id as AccessPathId,
      workId: row.work_id as WorkId,
      label: row.label,
      isPreferred,
      health,
      healthState: health,
      capabilities,
      lastCheckedAt: row.last_checked_at,
      lastOpenedAt: row.last_opened_at,
      provenance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    switch (row.kind) {
      case AccessPathKind.Web:
        return {
          ...base,
          kind: AccessPathKind.Web,
          url: row.url ?? '',
          provider: row.provider,
          fileId: null,
        } as WebAccessPath;

      case AccessPathKind.LocalFile:
        return {
          ...base,
          kind: AccessPathKind.LocalFile,
          filePath: row.url ?? '',
          fileId: row.file_id,
          format: null,
          url: null,
          provider: row.provider ?? null,
        } as LocalFileAccessPath;

      case AccessPathKind.Feed:
        return {
          ...base,
          kind: AccessPathKind.Feed,
          feedUrl: row.url ?? '',
          feedType: null,
          provider: row.provider,
          url: row.url,
          fileId: null,
        } as FeedAccessPath;

      case AccessPathKind.ManualReference:
      case AccessPathKind.Manual:
      default:
        return {
          ...base,
          kind: AccessPathKind.ManualReference,
          description: row.label ?? 'Manual Reference',
          locationRef: row.url ?? null,
          url: null,
          fileId: null,
          provider: row.provider ?? null,
        } as ManualReferenceAccessPath;
    }
  }

  private getCapabilitiesForPaths(pathIds: string[]): Map<string, AccessCapability[]> {
    const map = new Map<string, AccessCapability[]>();
    if (pathIds.length === 0) return map;

    const placeholders = pathIds.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT access_path_id, capability FROM source_capabilities
         WHERE access_path_id IN (${placeholders}) AND status = 'supported'`,
      )
      .all(...pathIds) as CapabilityRow[];

    for (const r of rows) {
      const list = map.get(r.access_path_id) ?? [];
      list.push(r.capability as AccessCapability);
      map.set(r.access_path_id, list);
    }
    return map;
  }

  async add(path: AccessPath): Promise<AccessPath> {
    return runInTransaction(this.db, () => {
      let urlValue: string | null = null;
      let fileIdValue: string | null = null;
      let providerValue: string | null = null;

      if (path.kind === AccessPathKind.Web) {
        urlValue = path.url;
        providerValue = path.provider;
      } else if (path.kind === AccessPathKind.LocalFile) {
        urlValue = path.filePath;
        fileIdValue = path.fileId;
        providerValue = path.provider ?? null;
      } else if (path.kind === AccessPathKind.Feed) {
        urlValue = path.feedUrl;
        providerValue = path.provider;
      } else if (path.kind === AccessPathKind.ManualReference) {
        urlValue = path.locationRef;
        providerValue = path.provider ?? null;
      }

      // If preferred, unset other preferred paths for this work
      if (path.isPreferred) {
        this.db.prepare('UPDATE access_paths SET is_preferred = 0 WHERE work_id = ?').run(path.workId);
      }

      this.db
        .prepare(
          `INSERT INTO access_paths (
            id, work_id, kind, provider, label, url, file_id,
            is_preferred, health_state, last_checked_at, last_opened_at,
            provenance, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          path.id,
          path.workId,
          path.kind,
          providerValue,
          path.label ?? null,
          urlValue,
          fileIdValue,
          path.isPreferred ? 1 : 0,
          path.healthState ?? path.health ?? SourceHealth.Unknown,
          path.lastCheckedAt ?? null,
          path.lastOpenedAt ?? null,
          path.provenance ? JSON.stringify(path.provenance) : null,
          path.createdAt,
          path.updatedAt,
        );

      // Insert capabilities if present
      if (path.capabilities && path.capabilities.length > 0) {
        const insertCap = this.db.prepare(
          'INSERT OR REPLACE INTO source_capabilities (access_path_id, capability, status) VALUES (?, ?, ?)',
        );
        for (const cap of path.capabilities) {
          insertCap.run(path.id, cap, 'supported');
        }
      }

      return path;
    });
  }

  async getById(id: AccessPathId): Promise<AccessPath | null> {
    const row = this.db.prepare('SELECT * FROM access_paths WHERE id = ?').get(id) as AccessPathRow | undefined;
    if (!row) return null;

    const capMap = this.getCapabilitiesForPaths([id]);
    return this.mapPath(row, capMap.get(id) ?? []);
  }

  async getByWork(workId: WorkId): Promise<readonly AccessPath[]> {
    const rows = this.db
      .prepare('SELECT * FROM access_paths WHERE work_id = ? ORDER BY is_preferred DESC, created_at ASC')
      .all(workId) as AccessPathRow[];

    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const capMap = this.getCapabilitiesForPaths(ids);

    return rows.map((r) => this.mapPath(r, capMap.get(r.id) ?? []));
  }

  async update(id: AccessPathId, patch: Partial<AccessPath>): Promise<AccessPath> {
    return runInTransaction(this.db, () => {
      const existing = this.db.prepare('SELECT * FROM access_paths WHERE id = ?').get(id) as AccessPathRow | undefined;
      if (!existing) {
        throw new Error(`AccessPath with id ${id} not found`);
      }

      const now = new Date().toISOString();
      const label = patch.label !== undefined ? patch.label : existing.label;
      const isPref = patch.isPreferred !== undefined ? (patch.isPreferred ? 1 : 0) : existing.is_preferred;
      const health = patch.healthState ?? patch.health ?? existing.health_state;
      const lastCheckedAt = patch.lastCheckedAt !== undefined ? patch.lastCheckedAt : existing.last_checked_at;
      const lastOpenedAt = patch.lastOpenedAt !== undefined ? patch.lastOpenedAt : existing.last_opened_at;
      const prov = patch.provenance !== undefined ? (patch.provenance ? JSON.stringify(patch.provenance) : null) : existing.provenance;

      let url = existing.url;
      let provider = existing.provider;
      let fileId = existing.file_id;

      if (patch.kind === AccessPathKind.Web) {
        url = patch.url ?? url;
        provider = patch.provider !== undefined ? patch.provider : provider;
      } else if (patch.kind === AccessPathKind.LocalFile) {
        url = patch.filePath ?? url;
        fileId = patch.fileId !== undefined ? patch.fileId : fileId;
        provider = patch.provider !== undefined ? patch.provider : provider;
      } else if (patch.kind === AccessPathKind.Feed) {
        url = patch.feedUrl ?? url;
        provider = patch.provider !== undefined ? patch.provider : provider;
      } else if (patch.kind === AccessPathKind.ManualReference) {
        url = patch.locationRef !== undefined ? patch.locationRef : url;
      }

      if (isPref === 1 && existing.is_preferred === 0) {
        this.db.prepare('UPDATE access_paths SET is_preferred = 0 WHERE work_id = ?').run(existing.work_id);
      }

      this.db
        .prepare(
          `UPDATE access_paths SET
            label = ?, is_preferred = ?, health_state = ?,
            last_checked_at = ?, last_opened_at = ?, provenance = ?,
            url = ?, provider = ?, file_id = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(label, isPref, health, lastCheckedAt, lastOpenedAt, prov, url, provider, fileId, now, id);

      const updatedRow = this.db.prepare('SELECT * FROM access_paths WHERE id = ?').get(id) as AccessPathRow;
      const capMap = this.getCapabilitiesForPaths([id]);
      return this.mapPath(updatedRow, capMap.get(id) ?? []);
    });
  }

  async remove(id: AccessPathId): Promise<void> {
    this.db.prepare('DELETE FROM access_paths WHERE id = ?').run(id);
  }

  async updateHealth(id: AccessPathId, health: SourceHealth, errorMessage?: string): Promise<void> {
    runInTransaction(this.db, () => {
      const now = new Date().toISOString();
      this.db
        .prepare('UPDATE access_paths SET health_state = ?, last_checked_at = ?, updated_at = ? WHERE id = ?')
        .run(health, now, now, id);

      this.db
        .prepare(
          'INSERT INTO source_health_events (id, access_path_id, health_state, checked_at, error_message) VALUES (?, ?, ?, ?, ?)',
        )
        .run(crypto.randomUUID(), id, health, now, errorMessage ?? null);
    });
  }

  async setPreferred(workId: WorkId, accessPathId: AccessPathId): Promise<void> {
    runInTransaction(this.db, () => {
      this.db.prepare('UPDATE access_paths SET is_preferred = 0 WHERE work_id = ?').run(workId);
      this.db.prepare('UPDATE access_paths SET is_preferred = 1, updated_at = ? WHERE id = ? AND work_id = ?').run(new Date().toISOString(), accessPathId, workId);
    });
  }

  async getCapabilities(accessPathId: AccessPathId): Promise<SourceCapability[]> {
    const rows = this.db
      .prepare('SELECT * FROM source_capabilities WHERE access_path_id = ?')
      .all(accessPathId) as CapabilityRow[];

    return rows.map((r) => ({
      accessPathId: r.access_path_id as AccessPathId,
      capability: r.capability,
      status: r.status as SourceCapabilityStatus,
    }));
  }

  async setCapability(accessPathId: AccessPathId, capability: string, status: SourceCapabilityStatus): Promise<void> {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO source_capabilities (access_path_id, capability, status) VALUES (?, ?, ?)',
      )
      .run(accessPathId, capability, status);
  }

  async getHealthEvents(accessPathId: AccessPathId, limit = 20): Promise<SourceHealthEvent[]> {
    const rows = this.db
      .prepare('SELECT * FROM source_health_events WHERE access_path_id = ? ORDER BY checked_at DESC LIMIT ?')
      .all(accessPathId, limit) as HealthEventRow[];

    return rows.map((r) => ({
      id: r.id,
      accessPathId: r.access_path_id as AccessPathId,
      healthState: r.health_state as SourceHealth,
      checkedAt: r.checked_at,
      errorMessage: r.error_message,
    }));
  }

  async recordHealthEvent(event: SourceHealthEvent): Promise<void> {
    this.db
      .prepare(
        'INSERT INTO source_health_events (id, access_path_id, health_state, checked_at, error_message) VALUES (?, ?, ?, ?, ?)',
      )
      .run(event.id, event.accessPathId, event.healthState, event.checkedAt, event.errorMessage);
  }
}
