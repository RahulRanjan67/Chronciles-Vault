/**
 * SQLite Connection Manager for Grimoire.
 *
 * Configures better-sqlite3 with WAL mode, foreign keys, busy timeout,
 * and provides safe transaction helpers.
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { runMigrations, type MigrationResult } from './migrations/runner.js';

export interface DatabaseOptions {
  /** File path for SQLite database. If omitted or ':memory:', an in-memory DB is used. */
  filename?: string;
  /** Whether to open in readonly mode (default: false). */
  readonly?: boolean;
  /** Milliseconds to wait before throwing SQLITE_BUSY (default: 5000). */
  busyTimeout?: number;
  /** Whether to execute pending migrations on connection (default: true for writable, false for readonly). */
  runMigrations?: boolean;
  /** Verbose SQL logging (default: false). */
  verbose?: boolean;
}

let activeInstance: Database.Database | null = null;
let activeDbPath: string | null = null;

/**
 * Configure standard pragmas for high performance, concurrency, and data safety.
 */
export function applyPragmas(db: Database.Database, busyTimeout = 5000): void {
  // WAL mode enables concurrent readers while a write occurs
  db.pragma('journal_mode = WAL');
  // Enforce foreign key constraints
  db.pragma('foreign_keys = ON');
  // Busy timeout ensures concurrent processes wait instead of immediately failing with SQLITE_BUSY
  db.pragma(`busy_timeout = ${busyTimeout}`);
  // Synchronous NORMAL is optimal for WAL mode
  db.pragma('synchronous = NORMAL');
  // 64MB cache size (-64000 KB)
  db.pragma('cache_size = -64000');
  // Temp store in memory
  db.pragma('temp_store = MEMORY');
}

/**
 * Create a new SQLite database connection with appropriate pragmas and optional migrations.
 */
export function createDatabase(options: DatabaseOptions = {}): Database.Database {
  const filename = options.filename || ':memory:';

  // If path is a real file, ensure parent directory exists
  if (filename !== ':memory:') {
    const dir = path.dirname(path.resolve(filename));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(filename, {
    readonly: options.readonly ?? false,
    verbose: options.verbose ? (msg?: unknown) => console.log(`[SQL]`, msg) : undefined,
    timeout: options.busyTimeout ?? 5000,
  });

  applyPragmas(db, options.busyTimeout ?? 5000);

  const shouldMigrate = options.runMigrations ?? !options.readonly;
  if (shouldMigrate) {
    runMigrations(db, { verbose: options.verbose });
  }

  return db;
}

/**
 * Get the singleton database connection, initializing it if necessary.
 */
export function getDatabase(options: DatabaseOptions = {}): Database.Database {
  const targetPath = options.filename || ':memory:';

  if (activeInstance) {
    if (activeDbPath === targetPath && !activeInstance.open) {
      // Reopen if closed
      activeInstance = null;
    } else if (activeDbPath === targetPath) {
      return activeInstance;
    } else {
      // Closing existing different instance
      try {
        activeInstance.close();
      } catch {
        // Ignore close error on previous instance
      }
      activeInstance = null;
    }
  }

  activeInstance = createDatabase(options);
  activeDbPath = targetPath;
  return activeInstance;
}

/**
 * Close active singleton connection if open.
 */
export function closeDatabase(): void {
  if (activeInstance) {
    try {
      if (activeInstance.open) {
        // Pragma optimize before closing to maintain index query planner statistics
        try {
          activeInstance.pragma('optimize');
        } catch {
          // ignore
        }
        activeInstance.close();
      }
    } finally {
      activeInstance = null;
      activeDbPath = null;
    }
  }
}

/**
 * Run a callback inside an atomic database transaction.
 * Automatically rolls back on error and commits on success.
 */
export function runInTransaction<T>(db: Database.Database, fn: () => T): T {
  const tx = db.transaction(fn);
  return tx();
}

/**
 * Run an async callback inside a transaction boundary.
 * Uses SQLite SAVEPOINT syntax to ensure rollbacks work cleanly with async/await.
 */
export async function runInTransactionAsync<T>(
  db: Database.Database,
  fn: () => Promise<T>,
): Promise<T> {
  const savepointId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  db.exec(`SAVEPOINT "${savepointId}"`);
  try {
    const result = await fn();
    db.exec(`RELEASE "${savepointId}"`);
    return result;
  } catch (err) {
    db.exec(`ROLLBACK TO "${savepointId}"`);
    db.exec(`RELEASE "${savepointId}"`);
    throw err;
  }
}
