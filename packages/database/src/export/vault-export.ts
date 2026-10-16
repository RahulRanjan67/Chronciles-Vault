import type Database from 'better-sqlite3';

export interface VaultExportDataV1 {
  version: 1;
  exportedAt: string;
  source: 'chronicles-vault';
  counts: {
    works: number;
    readingRelationships: number;
    accessPaths: number;
    memories: number;
    updateEntries: number;
    progressEvents: number;
  };
  data: {
    works: Array<Record<string, unknown>>;
    workAliases: Array<Record<string, unknown>>;
    workExternalIds: Array<Record<string, unknown>>;
    workGenres: Array<Record<string, unknown>>;
    workTags: Array<Record<string, unknown>>;
    readingRelationships: Array<Record<string, unknown>>;
    progressEvents: Array<Record<string, unknown>>;
    accessPaths: Array<Record<string, unknown>>;
    sourceCapabilities: Array<Record<string, unknown>>;
    memories: Array<Record<string, unknown>>;
    memoryTags: Array<Record<string, unknown>>;
    updateEntries: Array<Record<string, unknown>>;
  };
}

export interface VaultExportOptions {
  /** If true, omit works and memories with private or vault privacy_state */
  scrubPrivate?: boolean;
}

/**
 * Export all core vault records to a standardized JSON structure.
 */
export async function exportVaultToJson(
  db: Database.Database,
  options: VaultExportOptions = {},
): Promise<VaultExportDataV1> {
  const { scrubPrivate = false } = options;

  let works: Array<Record<string, unknown>>;
  let workAliases: Array<Record<string, unknown>>;
  let workExternalIds: Array<Record<string, unknown>>;
  let workGenres: Array<Record<string, unknown>>;
  let workTags: Array<Record<string, unknown>>;
  let readingRelationships: Array<Record<string, unknown>>;
  let progressEvents: Array<Record<string, unknown>>;
  let accessPaths: Array<Record<string, unknown>>;
  let sourceCapabilities: Array<Record<string, unknown>>;
  let memories: Array<Record<string, unknown>>;
  let memoryTags: Array<Record<string, unknown>>;
  let updateEntries: Array<Record<string, unknown>>;

  if (scrubPrivate) {
    // Exclude works where privacy_state is private or vault
    works = db
      .prepare("SELECT * FROM works WHERE privacy_state NOT IN ('private', 'vault')")
      .all() as Array<Record<string, unknown>>;

    const allowedWorkIds = new Set(works.map((w) => w.id as string));

    workAliases = (
      db.prepare('SELECT * FROM work_aliases').all() as Array<Record<string, unknown>>
    ).filter((a) => allowedWorkIds.has(a.work_id as string));

    workExternalIds = (
      db.prepare('SELECT * FROM work_external_ids').all() as Array<Record<string, unknown>>
    ).filter((e) => allowedWorkIds.has(e.work_id as string));

    workGenres = (
      db.prepare('SELECT * FROM work_genres').all() as Array<Record<string, unknown>>
    ).filter((g) => allowedWorkIds.has(g.work_id as string));

    workTags = (
      db.prepare('SELECT * FROM work_tags').all() as Array<Record<string, unknown>>
    ).filter((t) => allowedWorkIds.has(t.work_id as string));

    readingRelationships = (
      db.prepare('SELECT * FROM reading_relationships').all() as Array<Record<string, unknown>>
    ).filter((r) => allowedWorkIds.has(r.work_id as string));

    progressEvents = (
      db.prepare('SELECT * FROM progress_events').all() as Array<Record<string, unknown>>
    ).filter((p) => allowedWorkIds.has(p.work_id as string));

    accessPaths = (
      db.prepare('SELECT * FROM access_paths').all() as Array<Record<string, unknown>>
    ).filter((a) => allowedWorkIds.has(a.work_id as string));

    const allowedAccessPathIds = new Set(accessPaths.map((a) => a.id as string));

    sourceCapabilities = (
      db.prepare('SELECT * FROM source_capabilities').all() as Array<Record<string, unknown>>
    ).filter((s) => allowedAccessPathIds.has(s.access_path_id as string));

    // Exclude memories where privacy_state is private or vault, or not attached to allowed works
    memories = (
      db
        .prepare("SELECT * FROM memories WHERE privacy_state NOT IN ('private', 'vault')")
        .all() as Array<Record<string, unknown>>
    ).filter((m) => !m.work_id || allowedWorkIds.has(m.work_id as string));

    const allowedMemoryIds = new Set(memories.map((m) => m.id as string));

    memoryTags = (
      db.prepare('SELECT * FROM memory_tags').all() as Array<Record<string, unknown>>
    ).filter((m) => allowedMemoryIds.has(m.memory_id as string));

    updateEntries = (
      db.prepare('SELECT * FROM update_entries').all() as Array<Record<string, unknown>>
    ).filter((u) => allowedWorkIds.has(u.work_id as string));
  } else {
    works = db.prepare('SELECT * FROM works').all() as Array<Record<string, unknown>>;
    workAliases = db.prepare('SELECT * FROM work_aliases').all() as Array<Record<string, unknown>>;
    workExternalIds = db.prepare('SELECT * FROM work_external_ids').all() as Array<Record<string, unknown>>;
    workGenres = db.prepare('SELECT * FROM work_genres').all() as Array<Record<string, unknown>>;
    workTags = db.prepare('SELECT * FROM work_tags').all() as Array<Record<string, unknown>>;
    readingRelationships = db.prepare('SELECT * FROM reading_relationships').all() as Array<Record<string, unknown>>;
    progressEvents = db.prepare('SELECT * FROM progress_events').all() as Array<Record<string, unknown>>;
    accessPaths = db.prepare('SELECT * FROM access_paths').all() as Array<Record<string, unknown>>;
    sourceCapabilities = db.prepare('SELECT * FROM source_capabilities').all() as Array<Record<string, unknown>>;
    memories = db.prepare('SELECT * FROM memories').all() as Array<Record<string, unknown>>;
    memoryTags = db.prepare('SELECT * FROM memory_tags').all() as Array<Record<string, unknown>>;
    updateEntries = db.prepare('SELECT * FROM update_entries').all() as Array<Record<string, unknown>>;
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: 'chronicles-vault',
    counts: {
      works: works.length,
      readingRelationships: readingRelationships.length,
      accessPaths: accessPaths.length,
      memories: memories.length,
      updateEntries: updateEntries.length,
      progressEvents: progressEvents.length,
    },
    data: {
      works,
      workAliases,
      workExternalIds,
      workGenres,
      workTags,
      readingRelationships,
      progressEvents,
      accessPaths,
      sourceCapabilities,
      memories,
      memoryTags,
      updateEntries,
    },
  };
}
