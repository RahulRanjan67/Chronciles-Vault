-- Migration: 0002_app_settings
-- Description: Application settings and configuration tables

-- ============================================================
-- app_settings — persisted application configuration
-- ============================================================
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,               -- JSON-encoded value
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TEXT NOT NULL
);

-- Default settings
INSERT INTO app_settings (key, value, category, description, updated_at) VALUES
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

-- ============================================================
-- sync_state — per-source sync tracking
-- ============================================================
CREATE TABLE sync_state (
  id TEXT PRIMARY KEY,
  access_path_id TEXT NOT NULL REFERENCES access_paths(id) ON DELETE CASCADE,
  last_sync_at TEXT,
  last_success_at TEXT,
  next_sync_at TEXT,
  sync_cursor TEXT,                  -- provider-specific continuation cursor
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(access_path_id)
);

CREATE INDEX idx_sync_state_access_path ON sync_state(access_path_id);
CREATE INDEX idx_sync_state_next_sync   ON sync_state(next_sync_at) WHERE next_sync_at IS NOT NULL;
