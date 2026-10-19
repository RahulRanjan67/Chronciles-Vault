-- Grimoire Production D1 Relational Schema
-- Local-First Hybrid Architecture: Only identity, E2EE sync mailboxes, and CORS metadata edge cache are stored.

-- 1. Users & Cryptographic Public Key Registry
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  auth_token_hash TEXT NOT NULL,
  public_key TEXT,
  created_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Zero-Knowledge End-to-End Encrypted (E2EE) Sync Mailboxes
-- Server acts as a dumb blind postal locker. The payload is client-side encrypted ciphertext.
CREATE TABLE IF NOT EXISTS sync_mailboxes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  client_timestamp TEXT NOT NULL,
  state_vector TEXT,
  encrypted_payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_user_device ON sync_mailboxes(user_id, device_id);

-- 3. CORS Safe Metadata & Synopsis Cache
-- Caches synopsis, titles, and cover references for external reading sites that block browser CORS.
CREATE TABLE IF NOT EXISTS portal_metadata_cache (
  domain TEXT NOT NULL,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  cached_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (domain, item_key)
);

CREATE INDEX IF NOT EXISTS idx_metadata_expiry ON portal_metadata_cache(expires_at);

-- 4. Anonymized Diagnostic Reports (Zero PII)
CREATE TABLE IF NOT EXISTS diagnostic_reports (
  id TEXT PRIMARY KEY,
  client_version TEXT NOT NULL,
  platform TEXT NOT NULL,
  error_type TEXT NOT NULL,
  stack_trace TEXT,
  reported_at TEXT NOT NULL
);
