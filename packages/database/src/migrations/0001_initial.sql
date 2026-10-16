-- Migration: 0001_initial
-- Description: Core schema tables for Chronicles Vault

-- ============================================================
-- works
-- ============================================================
CREATE TABLE works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,        -- 'manga'|'manhwa'|'manhua'|'ln'|'anime'|'novel'|'comic'|'other'
  origin TEXT NOT NULL DEFAULT 'unknown',
  publication_state TEXT NOT NULL DEFAULT 'unknown',
  privacy_state TEXT NOT NULL DEFAULT 'public',
  cover_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- ============================================================
-- work_aliases (title + alternate titles)
-- ============================================================
CREATE TABLE work_aliases (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'alternative',  -- 'alternative' | 'alias'
  UNIQUE(work_id, alias)
);

-- ============================================================
-- work_external_ids
-- ============================================================
CREATE TABLE work_external_ids (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  UNIQUE(work_id, provider)
);

-- ============================================================
-- work_genres
-- ============================================================
CREATE TABLE work_genres (
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  PRIMARY KEY(work_id, genre)
);

-- ============================================================
-- work_tags
-- ============================================================
CREATE TABLE work_tags (
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY(work_id, tag)
);

-- ============================================================
-- work_relations
-- ============================================================
CREATE TABLE work_relations (
  id TEXT PRIMARY KEY,
  source_work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  target_work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,       -- 'sequel'|'prequel'|'spinoff'|'adaptation'|'alternative'|'related'
  created_at TEXT NOT NULL
);

-- ============================================================
-- reading_relationships
-- ============================================================
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

-- ============================================================
-- reading_attempts
-- ============================================================
CREATE TABLE reading_attempts (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT NOT NULL REFERENCES reading_relationships(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  final_anchor TEXT,                 -- JSON serialized ProgressAnchor
  notes TEXT,
  created_at TEXT NOT NULL
);

-- ============================================================
-- reading_sessions
-- ============================================================
CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT NOT NULL REFERENCES reading_relationships(id) ON DELETE CASCADE,
  access_path_id TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER,
  anchor_before TEXT,                -- JSON ProgressAnchor
  anchor_after TEXT,                 -- JSON ProgressAnchor
  created_at TEXT NOT NULL
);

-- ============================================================
-- access_paths
-- ============================================================
CREATE TABLE access_paths (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                -- 'web'|'local_file'|'feed'|'manual'
  provider TEXT,
  label TEXT,
  url TEXT,
  file_id TEXT,
  is_preferred INTEGER NOT NULL DEFAULT 0,
  health_state TEXT NOT NULL DEFAULT 'unknown', -- 'healthy'|'degraded'|'broken'|'unknown'
  last_checked_at TEXT,
  last_opened_at TEXT,
  provenance TEXT,                   -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- source_capabilities
-- ============================================================
CREATE TABLE source_capabilities (
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,          -- 'read'|'progress_sync'|'chapter_list'|'metadata'
  status TEXT NOT NULL DEFAULT 'unknown', -- 'supported'|'unsupported'|'unknown'
  PRIMARY KEY(access_path_id, capability)
);

-- ============================================================
-- source_health_events
-- ============================================================
CREATE TABLE source_health_events (
  id TEXT PRIMARY KEY,
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  health_state TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  error_message TEXT
);

-- ============================================================
-- progress_events
-- ============================================================
CREATE TABLE progress_events (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT REFERENCES reading_relationships(id),
  access_path_id TEXT REFERENCES access_paths(id),
  method TEXT NOT NULL,              -- 'manual'|'sync'|'inferred'|'imported'
  confidence TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed'|'estimated'|'inferred'
  anchor_before TEXT,                -- JSON ProgressAnchor
  anchor_after TEXT NOT NULL,        -- JSON ProgressAnchor
  provenance_note TEXT,
  created_at TEXT NOT NULL
);

-- ============================================================
-- captures
-- ============================================================
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
  state TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'matched'|'dismissed'|'archived'
  created_at TEXT NOT NULL
);

-- ============================================================
-- capture_batches
-- ============================================================
CREATE TABLE capture_batches (
  id TEXT PRIMARY KEY,
  label TEXT,
  source TEXT NOT NULL,              -- 'browser_tabs'|'bookmarks'|'manual'|'share'
  item_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- ============================================================
-- memories
-- ============================================================
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
  type TEXT NOT NULL,                -- 'note'|'screenshot'|'quote'|'review'|'reaction'
  title TEXT,
  body TEXT,
  privacy_state TEXT NOT NULL DEFAULT 'normal',
  spoiler_level TEXT NOT NULL DEFAULT 'spoiler_free',
  show_in_global_gallery INTEGER NOT NULL DEFAULT 1,
  access_path_id TEXT REFERENCES access_paths(id),
  progress_anchor TEXT,              -- JSON ProgressAnchor
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- memory_assets
-- ============================================================
CREATE TABLE memory_assets (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,          -- 'image'|'video'|'file'
  file_id TEXT NOT NULL,
  thumbnail_ref TEXT,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL
);

-- ============================================================
-- memory_tags
-- ============================================================
CREATE TABLE memory_tags (
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY(memory_id, tag)
);

-- ============================================================
-- local_files
-- ============================================================
CREATE TABLE local_files (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  display_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  content_hash TEXT,
  format TEXT,                       -- 'epub'|'pdf'|'cbz'|'cbr'
  modified_at TEXT,
  imported_at TEXT NOT NULL,
  metadata TEXT,                     -- JSON
  work_id TEXT REFERENCES works(id)
);

-- ============================================================
-- update_entries
-- ============================================================
CREATE TABLE update_entries (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  access_path_id TEXT REFERENCES access_paths(id),
  anchor TEXT NOT NULL,              -- JSON ProgressAnchor
  certainty TEXT NOT NULL DEFAULT 'unknown', -- 'confirmed'|'probable'|'unknown'
  source TEXT,
  detected_at TEXT NOT NULL,
  published_at TEXT
);

-- ============================================================
-- lists
-- ============================================================
CREATE TABLE lists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  privacy_state TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- list_items
-- ============================================================
CREATE TABLE list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  personal_note TEXT,
  created_at TEXT NOT NULL
);

-- ============================================================
-- publications
-- ============================================================
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

-- ============================================================
-- archive_records
-- ============================================================
CREATE TABLE archive_records (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  note TEXT,
  previous_state TEXT,
  previous_progress TEXT,            -- JSON ProgressAnchor
  archived_at TEXT NOT NULL
);

-- ============================================================
-- lore_entries
-- ============================================================
CREATE TABLE lore_entries (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,         -- 'character'|'location'|'faction'|'concept'|'item'|'event'
  name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- saved_views
-- ============================================================
CREATE TABLE saved_views (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filters TEXT NOT NULL,             -- JSON
  sort TEXT NOT NULL,
  display_mode TEXT NOT NULL DEFAULT 'grid',
  created_at TEXT NOT NULL
);

-- ============================================================
-- user_preferences
-- ============================================================
CREATE TABLE user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================================
-- event_log (domain events for sync and history)
-- ============================================================
CREATE TABLE event_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,             -- JSON
  device_id TEXT,
  created_at TEXT NOT NULL
);

-- ============================================================
-- FTS5 virtual table (public search only — no private content)
-- ============================================================
CREATE VIRTUAL TABLE search_fts USING fts5(
  entity_type,
  entity_id,
  title,
  content,
  tags,
  content='',
  contentless_delete=1
);

-- Search metadata lookup for contentless FTS
CREATE TABLE IF NOT EXISTS search_lookup (
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  UNIQUE(entity_type, entity_id)
);
