/**
 * Migration runner for Grimoire SQLite database.
 *
 * Tracks applied migrations in `schema_migrations` table and runs
 * missing ones in order. Safe to run on both fresh and existing DBs.
 * Includes embedded fallbacks for packaged/bundled runtimes where .sql files are absent.
 */

import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const getCurrentDirname = (): string => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
};

export interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
  errors: Array<{ name: string; error: string }>;
}

export interface MigrationFile {
  name: string;
  filePath?: string;
  sql?: string;
}

/**
 * Ensure the schema_migrations tracking table exists.
 */
function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Get the set of already-applied migration names.
 */
function getAppliedMigrations(db: Database.Database): Set<string> {
  const rows = db
    .prepare('SELECT name FROM schema_migrations ORDER BY id')
    .all() as Array<{ name: string }>;
  return new Set(rows.map((r) => r.name));
}

/**
 * Embedded SQL fallback for bundled environments where .sql files are not distributed.
 */
const EMBEDDED_MIGRATIONS: Record<string, string> = {
  '0001_initial': `
CREATE TABLE works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT 'unknown',
  publication_state TEXT NOT NULL DEFAULT 'unknown',
  privacy_state TEXT NOT NULL DEFAULT 'public',
  cover_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE work_aliases (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'alternative',
  UNIQUE(work_id, alias)
);

CREATE TABLE work_external_ids (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  UNIQUE(work_id, provider)
);

CREATE TABLE work_genres (
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  PRIMARY KEY(work_id, genre)
);

CREATE TABLE work_tags (
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY(work_id, tag)
);

CREATE TABLE work_relations (
  id TEXT PRIMARY KEY,
  source_work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  target_work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE reading_relationships (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  personal_state TEXT NOT NULL DEFAULT 'planned',
  priority TEXT NOT NULL DEFAULT 'normal',
  started_at TEXT,
  last_active_at TEXT,
  completed_at TEXT,
  stopped_at TEXT,
  stopped_reason TEXT,
  stopped_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(work_id)
);

CREATE TABLE reading_attempts (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT NOT NULL REFERENCES reading_relationships(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  final_anchor TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT NOT NULL REFERENCES reading_relationships(id) ON DELETE CASCADE,
  access_path_id TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER,
  anchor_before TEXT,
  anchor_after TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE access_paths (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  provider TEXT,
  label TEXT,
  url TEXT,
  file_id TEXT,
  is_preferred INTEGER NOT NULL DEFAULT 0,
  health_state TEXT NOT NULL DEFAULT 'unknown',
  last_checked_at TEXT,
  last_opened_at TEXT,
  provenance TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE source_capabilities (
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  PRIMARY KEY(access_path_id, capability)
);

CREATE TABLE source_health_events (
  id TEXT PRIMARY KEY,
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  health_state TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  error_message TEXT
);

CREATE TABLE progress_events (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT REFERENCES reading_relationships(id),
  access_path_id TEXT REFERENCES access_paths(id),
  method TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'confirmed',
  anchor_before TEXT,
  anchor_after TEXT NOT NULL,
  provenance_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  batch_id TEXT,
  url TEXT,
  normalized_url TEXT,
  title TEXT,
  favicon_ref TEXT,
  browser TEXT,
  window_label TEXT,
  captured_at TEXT NOT NULL,
  possible_work_id TEXT REFERENCES works(id),
  confidence_score REAL,
  state TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE capture_batches (
  id TEXT PRIMARY KEY,
  label TEXT,
  source TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  privacy_state TEXT NOT NULL DEFAULT 'normal',
  spoiler_level TEXT NOT NULL DEFAULT 'spoiler_free',
  show_in_global_gallery INTEGER NOT NULL DEFAULT 1,
  access_path_id TEXT REFERENCES access_paths(id),
  progress_anchor TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE memory_assets (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  file_id TEXT NOT NULL,
  thumbnail_ref TEXT,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE memory_tags (
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY(memory_id, tag)
);

CREATE TABLE local_files (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  display_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  content_hash TEXT,
  format TEXT,
  modified_at TEXT,
  imported_at TEXT NOT NULL,
  metadata TEXT,
  work_id TEXT REFERENCES works(id)
);

CREATE TABLE update_entries (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  access_path_id TEXT REFERENCES access_paths(id),
  anchor TEXT NOT NULL,
  certainty TEXT NOT NULL DEFAULT 'unknown',
  source TEXT,
  detected_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE lists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  privacy_state TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  personal_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE publications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  list_id TEXT REFERENCES lists(id),
  published_at TEXT,
  privacy_state TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE archive_records (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  note TEXT,
  previous_state TEXT,
  previous_progress TEXT,
  archived_at TEXT NOT NULL
);

CREATE TABLE lore_entries (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE saved_views (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filters TEXT NOT NULL,
  sort TEXT NOT NULL,
  display_mode TEXT NOT NULL DEFAULT 'grid',
  created_at TEXT NOT NULL
);

CREATE TABLE user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE event_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  device_id TEXT,
  created_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE search_fts USING fts5(
  entity_type,
  entity_id,
  title,
  content,
  tags,
  content='',
  contentless_delete=1
);

CREATE TABLE IF NOT EXISTS search_lookup (
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  UNIQUE(entity_type, entity_id)
);
`,
  '0001_indexes': `
CREATE INDEX IF NOT EXISTS idx_works_content_type    ON works(content_type);
CREATE INDEX IF NOT EXISTS idx_works_privacy_state   ON works(privacy_state);
CREATE INDEX IF NOT EXISTS idx_works_publication_state ON works(publication_state);
CREATE INDEX IF NOT EXISTS idx_works_updated_at      ON works(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_created_at      ON works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_deleted_at      ON works(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_aliases_work_id  ON work_aliases(work_id);
CREATE INDEX IF NOT EXISTS idx_work_aliases_alias    ON work_aliases(alias COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_work_external_ids_work_id   ON work_external_ids(work_id);
CREATE INDEX IF NOT EXISTS idx_work_external_ids_provider  ON work_external_ids(provider, external_id);

CREATE INDEX IF NOT EXISTS idx_work_genres_genre     ON work_genres(genre);
CREATE INDEX IF NOT EXISTS idx_work_tags_tag         ON work_tags(tag);

CREATE INDEX IF NOT EXISTS idx_work_relations_source ON work_relations(source_work_id);
CREATE INDEX IF NOT EXISTS idx_work_relations_target ON work_relations(target_work_id);
CREATE INDEX IF NOT EXISTS idx_work_relations_type   ON work_relations(relation_type);

CREATE INDEX IF NOT EXISTS idx_reading_rel_personal_state ON reading_relationships(personal_state);
CREATE INDEX IF NOT EXISTS idx_reading_rel_priority       ON reading_relationships(priority);
CREATE INDEX IF NOT EXISTS idx_reading_rel_last_active    ON reading_relationships(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_rel_completed_at   ON reading_relationships(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reading_rel_started_at     ON reading_relationships(started_at DESC)   WHERE started_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reading_attempts_work_id   ON reading_attempts(work_id);
CREATE INDEX IF NOT EXISTS idx_reading_attempts_rel_id    ON reading_attempts(reading_relationship_id);
CREATE INDEX IF NOT EXISTS idx_reading_attempts_started   ON reading_attempts(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_work_id   ON reading_sessions(work_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_rel_id    ON reading_sessions(reading_relationship_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_access    ON reading_sessions(access_path_id) WHERE access_path_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reading_sessions_started   ON reading_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_paths_work_id       ON access_paths(work_id);
CREATE INDEX IF NOT EXISTS idx_access_paths_kind          ON access_paths(kind);
CREATE INDEX IF NOT EXISTS idx_access_paths_health        ON access_paths(health_state);
CREATE INDEX IF NOT EXISTS idx_access_paths_preferred     ON access_paths(work_id, is_preferred);
CREATE INDEX IF NOT EXISTS idx_access_paths_provider      ON access_paths(provider) WHERE provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_access_paths_last_opened   ON access_paths(last_opened_at DESC) WHERE last_opened_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_health_events_access_path  ON source_health_events(access_path_id);
CREATE INDEX IF NOT EXISTS idx_health_events_checked_at   ON source_health_events(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_events_work_id    ON progress_events(work_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_rel_id     ON progress_events(reading_relationship_id) WHERE reading_relationship_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_progress_events_access     ON progress_events(access_path_id) WHERE access_path_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_progress_events_created    ON progress_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_events_method     ON progress_events(method);

CREATE INDEX IF NOT EXISTS idx_captures_batch_id          ON captures(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_captures_state             ON captures(state);
CREATE INDEX IF NOT EXISTS idx_captures_possible_work     ON captures(possible_work_id) WHERE possible_work_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_captures_captured_at       ON captures(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_captures_normalized_url    ON captures(normalized_url) WHERE normalized_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_capture_batches_source     ON capture_batches(source);
CREATE INDEX IF NOT EXISTS idx_capture_batches_created    ON capture_batches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_work_id           ON memories(work_id) WHERE work_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_type              ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_privacy           ON memories(privacy_state);
CREATE INDEX IF NOT EXISTS idx_memories_gallery           ON memories(show_in_global_gallery, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_created_at        ON memories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_assets_memory_id    ON memory_assets(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_tag            ON memory_tags(tag);

CREATE INDEX IF NOT EXISTS idx_local_files_work_id        ON local_files(work_id) WHERE work_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_local_files_format         ON local_files(format) WHERE format IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_local_files_content_hash   ON local_files(content_hash) WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_update_entries_work_id     ON update_entries(work_id);
CREATE INDEX IF NOT EXISTS idx_update_entries_access      ON update_entries(access_path_id) WHERE access_path_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_update_entries_detected    ON update_entries(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_update_entries_certainty   ON update_entries(certainty);

CREATE INDEX IF NOT EXISTS idx_lists_privacy              ON lists(privacy_state);
CREATE INDEX IF NOT EXISTS idx_lists_updated              ON lists(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id         ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_work_id         ON list_items(work_id);
CREATE INDEX IF NOT EXISTS idx_list_items_position        ON list_items(list_id, position);

CREATE INDEX IF NOT EXISTS idx_archive_records_work_id    ON archive_records(work_id);
CREATE INDEX IF NOT EXISTS idx_archive_records_archived   ON archive_records(archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_lore_entries_work_id       ON lore_entries(work_id);
CREATE INDEX IF NOT EXISTS idx_lore_entries_entity_type   ON lore_entries(entity_type);

CREATE INDEX IF NOT EXISTS idx_event_log_entity           ON event_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_log_event_type       ON event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_event_log_created_at       ON event_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_device           ON event_log(device_id) WHERE device_id IS NOT NULL;
`,
  '0002_app_settings': `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value, category, description, updated_at) VALUES
  ('app.theme',                  '"system"',   'appearance', 'UI theme: light | dark | system', datetime('now')),
  ('app.language',               '"en"',       'general',    'App language code', datetime('now')),
  ('app.default_privacy',        '"public"',   'privacy',    'Default privacy for new works', datetime('now')),
  ('app.show_global_gallery',    'true',       'gallery',    'Show public gallery by default', datetime('now')),
  ('app.auto_detect_updates',    'true',       'updates',    'Auto-detect work updates from sources', datetime('now')),
  ('app.progress_sync_interval', '300',        'sync',       'Progress sync interval in seconds', datetime('now')),
  ('app.capture_auto_match',     'true',       'capture',    'Auto-match captures to known works', datetime('now')),
  ('app.default_sort',           '"updated_at_desc"', 'library', 'Default sort for library view', datetime('now')),
  ('app.default_display_mode',   '"grid"',     'library',    'Default display mode: grid | list | table', datetime('now')),
  ('app.device_id',              '""',         'sync',       'Unique device identifier for sync', datetime('now')),
  ('app.vault_path',             '""',         'storage',    'Path to vault storage directory', datetime('now')),
  ('app.backup_enabled',         'false',      'storage',    'Enable automatic backups', datetime('now')),
  ('app.backup_interval_hours',  '24',         'storage',    'Backup interval in hours', datetime('now'));

CREATE TABLE IF NOT EXISTS sync_state (
  id TEXT PRIMARY KEY,
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  last_sync_at TEXT,
  last_success_at TEXT,
  next_sync_at TEXT,
  sync_cursor TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(access_path_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_state_access_path ON sync_state(access_path_id);
CREATE INDEX IF NOT EXISTS idx_sync_state_next_sync   ON sync_state(next_sync_at) WHERE next_sync_at IS NOT NULL;
`,
};

function compareMigrationNames(a: string, b: string): number {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (!isNaN(numA) && !isNaN(numB) && numA === numB) {
    if (a.includes('initial')) return -1;
    if (b.includes('initial')) return 1;
  }
  return a.localeCompare(b);
}

/**
 * Discover migration files from disk or use embedded fallback migrations.
 */
function discoverMigrationFiles(customDir?: string): MigrationFile[] {
  const candidates = [
    customDir,
    path.resolve(getCurrentDirname(), '.'),
    path.resolve(getCurrentDirname(), 'migrations'),
    path.resolve(getCurrentDirname(), '../src/migrations'),
    path.resolve(getCurrentDirname(), '../migrations'),
    path.resolve(process.cwd(), 'src/migrations'),
    path.resolve(process.cwd(), 'packages/database/src/migrations'),
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      try {
        const sqlFiles = fs
          .readdirSync(dir)
          .filter((f) => f.endsWith('.sql'))
          .sort(compareMigrationNames);

        if (sqlFiles.length > 0) {
          return sqlFiles.map((f) => ({
            name: f.replace(/\.sql$/, ''),
            filePath: path.join(dir, f),
          }));
        }
      } catch {
        // continue
      }
    }
  }

  // Fallback to embedded migrations in sorted order
  return Object.keys(EMBEDDED_MIGRATIONS)
    .sort(compareMigrationNames)
    .map((name) => ({
      name,
      sql: EMBEDDED_MIGRATIONS[name],
    }));
}

/**
 * Apply a single migration inside a savepoint transaction.
 */
function applyMigration(db: Database.Database, migration: MigrationFile): void {
  const sql = migration.filePath ? fs.readFileSync(migration.filePath, 'utf8') : migration.sql;
  if (!sql) throw new Error(`No SQL content for migration ${migration.name}`);

  const savepointName = `migration_${migration.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;

  db.exec(`SAVEPOINT "${savepointName}"`);
  try {
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(
      migration.name,
      new Date().toISOString(),
    );
    db.exec(`RELEASE "${savepointName}"`);
  } catch (err) {
    db.exec(`ROLLBACK TO "${savepointName}"`);
    db.exec(`RELEASE "${savepointName}"`);
    throw err;
  }
}

/**
 * Run all pending migrations against the given database connection.
 */
export function runMigrations(
  db: Database.Database,
  options: { dryRun?: boolean; verbose?: boolean; migrationsDir?: string } = {},
): MigrationResult {
  const { dryRun = false, verbose = false, migrationsDir } = options;
  const result: MigrationResult = { applied: [], skipped: [], errors: [] };

  ensureMigrationsTable(db);
  const applied = getAppliedMigrations(db);
  const pending = discoverMigrationFiles(migrationsDir).filter(
    ({ name }) => !applied.has(name),
  );

  if (verbose) {
    console.log(
      `[migrations] Applied: ${applied.size}, Pending: ${pending.length}`,
    );
  }

  if (pending.length === 0) {
    return result;
  }

  if (dryRun) {
    for (const { name } of pending) {
      if (verbose) console.log(`[migrations] Would apply: ${name}`);
      result.applied.push(name);
    }
    return result;
  }

  const runAll = db.transaction(() => {
    for (const migration of pending) {
      try {
        if (verbose) console.log(`[migrations] Applying: ${migration.name}`);
        applyMigration(db, migration);
        result.applied.push(migration.name);
        if (verbose) console.log(`[migrations] Applied:  ${migration.name} ✓`);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        result.errors.push({ name: migration.name, error });
        if (verbose) console.error(`[migrations] Failed:   ${migration.name} — ${error}`);
        throw err;
      }
    }
  });

  try {
    runAll();
  } catch {
    // errors recorded in result.errors
  }

  return result;
}

export function listAppliedMigrations(db: Database.Database): MigrationRecord[] {
  ensureMigrationsTable(db);
  return db
    .prepare('SELECT id, name, applied_at FROM schema_migrations ORDER BY id ASC')
    .all() as MigrationRecord[];
}
