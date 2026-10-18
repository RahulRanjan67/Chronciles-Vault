# Chronicles Vault — Database Architecture & Schema Specification

## 1. Engine & Runtime Configuration

Chronicles Vault uses an embedded **SQLite 3 (v3.42+)** engine. The current workspace uses `better-sqlite3` in local node/test environments; the planned Capacitor native client must use a reviewed SQLite plugin behind the database repository boundary. Browser-only persistence uses browser storage adapters and does not claim native SQLite durability.

### 1.1 PRAGMA Configuration
Every database connection MUST execute the following initialization commands immediately upon opening:

```sql
-- Enforce atomic, high-performance WAL mode
PRAGMA journal_mode = WAL;

-- Balance durability and performance on SSDs
PRAGMA synchronous = NORMAL;

-- Enforce relational integrity
PRAGMA foreign_keys = ON;

-- Busy timeout to prevent lock contention crashes under concurrent reads/writes
PRAGMA busy_timeout = 5000;

-- Memory cache size: 64MB working cache
PRAGMA cache_size = -64000;

-- Store temporary tables and indices in memory
PRAGMA temp_store = MEMORY;

-- UTF-8 text encoding
PRAGMA encoding = "UTF-8";
```

---

## 2. Relational Schema Specification

### 2.1 Core Works & Metadata

#### `works`
Primary entity representing intellectual media.
```sql
CREATE TABLE works (
  id TEXT PRIMARY KEY,                       -- Branded UUID v4 (e.g., 'wrk_01HGB...')
  title TEXT NOT NULL,                      -- Canonical display title
  description TEXT,                         -- Full text summary / blurb
  content_type TEXT NOT NULL,               -- 'manga'|'manhwa'|'manhua'|'webtoon'|'light_novel'|'web_novel'|'western_novel'|'anime'|'donghua'|'epub'|'pdf'|'cbz'
  origin TEXT NOT NULL DEFAULT 'unknown',   -- 'korean'|'japanese'|'chinese'|'western'|'original'|'unknown'
  publication_state TEXT NOT NULL DEFAULT 'unknown', -- 'ongoing'|'completed'|'hiatus'|'cancelled'|'unknown'
  privacy_state TEXT NOT NULL DEFAULT 'public',      -- 'public'|'private'|'vault'
  cover_ref TEXT,                           -- Relative path or asset key for cover image
  created_at TEXT NOT NULL,                 -- ISO 8601 UTC
  updated_at TEXT NOT NULL,                 -- ISO 8601 UTC
  deleted_at TEXT                           -- ISO 8601 UTC soft-delete timestamp
);
```

#### `work_aliases`
Alternative titles, romanizations, translated variants, and colloquial nicknames.
```sql
CREATE TABLE work_aliases (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'alternative', -- 'alternative' | 'alias'
  UNIQUE(work_id, alias)
);
```

#### `work_external_ids`
Mappings to external catalogs and trackers.
```sql
CREATE TABLE work_external_ids (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                   -- e.g. 'anilist'|'myanimelist'|'mangaupdates'|'isbn'|'goodreads'
  external_id TEXT NOT NULL,                -- External key or ISBN
  UNIQUE(work_id, provider)
);
```

#### `work_genres` & `work_tags`
Normalized taxonomy tables for works.
```sql
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
```

#### `work_relations`
Graph edges representing series sequels, prequels, spin-offs, and adaptations.
```sql
CREATE TABLE work_relations (
  id TEXT PRIMARY KEY,
  source_work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  target_work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,              -- 'sequel'|'prequel'|'spinoff'|'adaptation'|'alternative'|'related'
  created_at TEXT NOT NULL
);
```

---

### 2.2 Reading Tracking & Sessions

#### `reading_relationships`
One-to-one record representing user's reading status for a given work.
```sql
CREATE TABLE reading_relationships (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  personal_state TEXT NOT NULL DEFAULT 'planned', -- 'planned'|'reading'|'on_hold'|'completed'|'dropped'|'rereading'
  priority TEXT NOT NULL DEFAULT 'normal',        -- 'low'|'normal'|'high'|'urgent'
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
```

#### `reading_attempts`
Tracks distinct reading runs (e.g., initial read in 2024, re-read in 2026).
```sql
CREATE TABLE reading_attempts (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT NOT NULL REFERENCES reading_relationships(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  final_anchor TEXT,                        -- JSON serialized ProgressAnchor
  notes TEXT,
  created_at TEXT NOT NULL
);
```

#### `reading_sessions`
Granular, timed reading blocks for velocity calculation and heatmaps.
```sql
CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT NOT NULL REFERENCES reading_relationships(id) ON DELETE CASCADE,
  access_path_id TEXT,                      -- Nullable reference to access_paths(id)
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER,
  anchor_before TEXT,                       -- JSON ProgressAnchor
  anchor_after TEXT,                        -- JSON ProgressAnchor
  created_at TEXT NOT NULL
);
```

#### `progress_events`
Append-only log of every single reading position movement.
```sql
CREATE TABLE progress_events (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  reading_relationship_id TEXT REFERENCES reading_relationships(id),
  access_path_id TEXT REFERENCES access_paths(id),
  method TEXT NOT NULL,                     -- 'manual'|'sync'|'inferred'|'imported'
  confidence TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed'|'estimated'|'inferred'
  anchor_before TEXT,                       -- JSON ProgressAnchor
  anchor_after TEXT NOT NULL,               -- JSON ProgressAnchor
  provenance_note TEXT,
  created_at TEXT NOT NULL
);
```

---

### 2.3 Access Paths & Source Adapters

#### `access_paths`
Points of consumption for a work (web, file, feed, manual).
```sql
CREATE TABLE access_paths (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                       -- 'web'|'local_file'|'feed'|'manual'
  provider TEXT,                            -- Identifier string (e.g., 'local-reader', 'mangadex')
  label TEXT,                               -- Friendly name (e.g., 'EPUB - Calibre Library')
  url TEXT,                                 -- Web address or protocol link
  file_id TEXT,                             -- Foreign key to local_files(id)
  is_preferred INTEGER NOT NULL DEFAULT 0,  -- 1 if default launch target
  health_state TEXT NOT NULL DEFAULT 'unknown', -- 'healthy'|'degraded'|'broken'|'unknown'
  last_checked_at TEXT,
  last_opened_at TEXT,
  provenance TEXT,                          -- JSON metadata
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### `source_capabilities` & `source_health_events`
Capabilities and health telemetry for access paths.
```sql
CREATE TABLE source_capabilities (
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,                 -- 'read'|'progress_sync'|'chapter_list'|'metadata'
  status TEXT NOT NULL DEFAULT 'unknown',   -- 'supported'|'unsupported'|'unknown'
  PRIMARY KEY(access_path_id, capability)
);

CREATE TABLE source_health_events (
  id TEXT PRIMARY KEY,
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  health_state TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  error_message TEXT
);
```

#### `sync_state`
Sync checkpoints and cursors for background polling.
```sql
CREATE TABLE sync_state (
  id TEXT PRIMARY KEY,
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  last_sync_at TEXT,
  last_success_at TEXT,
  next_sync_at TEXT,
  sync_cursor TEXT,                         -- Provider pagination cursor or hash
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(access_path_id)
);
```

---

### 2.4 Memories, Highlights & Assets

#### `memories`
Reader captures, quotes, thoughts, and reviews.
```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
  type TEXT NOT NULL,                       -- 'note'|'screenshot'|'quote'|'review'|'reaction'
  title TEXT,
  body TEXT,
  privacy_state TEXT NOT NULL DEFAULT 'normal', -- 'normal'|'vault'
  spoiler_level TEXT NOT NULL DEFAULT 'spoiler_free', -- 'spoiler_free'|'minor_spoiler'|'major_spoiler'
  show_in_global_gallery INTEGER NOT NULL DEFAULT 1,
  access_path_id TEXT REFERENCES access_paths(id),
  progress_anchor TEXT,                     -- JSON ProgressAnchor
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### `memory_assets` & `memory_tags`
Attached image/video binaries and tags.
```sql
CREATE TABLE memory_assets (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,                 -- 'image'|'video'|'file'
  file_id TEXT NOT NULL,                    -- Vault asset store ID or local path
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
```

---

### 2.5 Local File Registry & Captures

#### `local_files`
Index of local media on disk managed by the user.
```sql
CREATE TABLE local_files (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,                       -- Absolute or library-relative path
  display_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  content_hash TEXT,                        -- SHA-256 for deduplication
  format TEXT,                              -- 'epub'|'pdf'|'cbz'|'cbr'
  modified_at TEXT,
  imported_at TEXT NOT NULL,
  metadata TEXT,                            -- JSON (page count, embedded title, TOC)
  work_id TEXT REFERENCES works(id)
);
```

#### `captures` & `capture_batches`
Browser extension ingestion staging area.
```sql
CREATE TABLE capture_batches (
  id TEXT PRIMARY KEY,
  label TEXT,
  source TEXT NOT NULL,                     -- 'browser_tabs'|'bookmarks'|'manual'|'share'
  item_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES capture_batches(id) ON DELETE SET NULL,
  url TEXT,
  normalized_url TEXT,
  title TEXT,
  favicon_ref TEXT,
  browser TEXT,
  window_label TEXT,
  captured_at TEXT NOT NULL,
  possible_work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
  confidence_score REAL,
  state TEXT NOT NULL DEFAULT 'pending',    -- 'pending'|'matched'|'dismissed'|'archived'
  created_at TEXT NOT NULL
);
```

---

### 2.6 Lists, Lore, Archival & System Configuration

#### `lists` & `list_items`
```sql
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
```

#### `lore_entries` & `archive_records`
```sql
CREATE TABLE lore_entries (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,                -- 'character'|'location'|'faction'|'concept'|'item'|'event'
  name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
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
```

#### `app_settings` & `event_log`
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,                      -- JSON-encoded string/number/bool/object
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE event_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,                    -- JSON domain event
  device_id TEXT,
  created_at TEXT NOT NULL
);
```

---

## 3. Full-Text Search (FTS5) Engine

### 3.1 Table Definition
Chronicles Vault maintains a contentless FTS5 index for fast, low-overhead search across public works, memories, and lore entries. Vault-encrypted content is **strictly excluded** from this index.

```sql
CREATE VIRTUAL TABLE search_fts USING fts5(
  entity_type,                              -- 'work' | 'memory' | 'lore'
  entity_id UNINDEXED,                      -- UUID reference
  title,                                    -- Primary matching title
  content,                                  -- Searchable text body
  tags,                                     -- Aggregated space-separated tags
  content='',                               -- Contentless table (saves 60% disk)
  contentless_delete=1,                     -- SQLite 3.43+ support for contentless deletion
  tokenize='porter unicode61 remove_diacritics 2'
);
```

### 3.2 FTS Synchronization Triggers
Automatic triggers keep `search_fts` synchronized with base tables.

```sql
-- Work Insert Trigger
CREATE TRIGGER trg_works_fts_insert AFTER INSERT ON works
WHEN new.privacy_state != 'vault' AND new.deleted_at IS NULL
BEGIN
  INSERT INTO search_fts(entity_type, entity_id, title, content, tags)
  VALUES ('work', new.id, new.title, coalesce(new.description, ''), '');
END;

-- Work Update Trigger
CREATE TRIGGER trg_works_fts_update AFTER UPDATE ON works
BEGIN
  DELETE FROM search_fts WHERE entity_id = old.id;
  INSERT INTO search_fts(entity_type, entity_id, title, content, tags)
  SELECT 'work', new.id, new.title, coalesce(new.description, ''), ''
  WHERE new.privacy_state != 'vault' AND new.deleted_at IS NULL;
END;

-- Work Delete Trigger
CREATE TRIGGER trg_works_fts_delete AFTER DELETE ON works
BEGIN
  DELETE FROM search_fts WHERE entity_id = old.id;
END;

-- Memory Insert Trigger (public/normal only)
CREATE TRIGGER trg_memories_fts_insert AFTER INSERT ON memories
WHEN new.privacy_state != 'vault'
BEGIN
  INSERT INTO search_fts(entity_type, entity_id, title, content, tags)
  VALUES ('memory', new.id, coalesce(new.title, ''), coalesce(new.body, ''), '');
END;

-- Memory Delete Trigger
CREATE TRIGGER trg_memories_fts_delete AFTER DELETE ON memories
BEGIN
  DELETE FROM search_fts WHERE entity_id = old.id;
END;
```

---

## 4. Performance Indexing Matrix

| Index Name | Target Table | Columns | Purpose |
|---|---|---|---|
| `idx_works_content_type` | `works` | `content_type` | Filter by format (manga, epub) |
| `idx_works_privacy_state` | `works` | `privacy_state` | Omit vault items in public view |
| `idx_works_updated_at` | `works` | `updated_at DESC` | Default library sort order |
| `idx_work_aliases_alias` | `work_aliases` | `alias COLLATE NOCASE` | Fast case-insensitive title lookup |
| `idx_reading_rel_personal_state` | `reading_relationships` | `personal_state` | Shelf filtering (reading, completed) |
| `idx_reading_rel_last_active` | `reading_relationships` | `last_active_at DESC`| Return Desk sorting |
| `idx_access_paths_work_id` | `access_paths` | `work_id` | Fetch all formats/links for a work |
| `idx_access_paths_preferred` | `access_paths` | `work_id, is_preferred` | Instant "Continue Reading" button |
| `idx_memories_work_id` | `memories` | `work_id` | Load book memory timeline |
| `idx_memories_gallery` | `memories` | `show_in_global_gallery, created_at DESC` | Feed stream on Home view |
| `idx_captures_state` | `captures` | `state` | Unprocessed browser tab triage |

---

## 5. Migration Strategy & Runner

### 5.1 Rules of Migration
1. **Linear Ordering**: Migrations are named `NNNN_description.sql` (e.g., `0001_initial.sql`).
2. **Schema Table**: Migrations record their application in `schema_migrations`:
   ```sql
   CREATE TABLE IF NOT EXISTS schema_migrations (
     version INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     applied_at TEXT NOT NULL
   );
   ```
3. **Atomic Execution**: Every migration file runs inside an explicit transaction (`BEGIN IMMEDIATE TRANSACTION; ... COMMIT;`). If any statement fails, the entire migration rolls back.
4. **Zero-Destruction**: Production migrations must never drop non-empty columns or tables without a staged copy-and-rename deprecation cycle.

---

## 6. Seed Data Strategy

Chronicles Vault includes built-in seed scripts in `scripts/seed/`:
1. **Core Settings**: Pre-populates `app_settings` with default theme (`system`), auto-detection flags, and display preferences.
2. **Standard Shelves/Lists**: Creates system default shelves: "Reading Now", "To Read", "Completed", "Abandoned".
3. **Fixture Profiles for Development/Testing**:
   - `minimal`: 5 works with sample progress and access paths.
   - `rich`: 50 works across all content types with realistic reading sessions, memory quotes, and cover arts.
   - `stress-500`: 500 works and 2,500 memories used for automated FPS and query performance benchmarks.
