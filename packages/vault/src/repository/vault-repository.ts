import { encrypt, decrypt, type EncryptedPayload } from '../crypto/encryption.js'
import type { VaultKeyRecord } from '../crypto/vault-key.js'
import { vaultSession, type VaultSession } from '../session/vault-session.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultItem {
  id: string
  entityType: string // 'work' | 'memory' | 'note' | 'source'
  entityId: string
  encryptedPayload: EncryptedPayload
  iv: string // per-item IV
  createdAt: string
  updatedAt: string
}

export interface VaultSummary {
  itemCount: number
  lastModified: string | null
}

export interface VaultRepository {
  /** Store an encrypted record for the entity. Callable only when unlocked. */
  store(
    entityType: string,
    entityId: string,
    plaintext: Record<string, unknown>,
    masterKey: CryptoKey,
  ): Promise<VaultItem>

  /** Decrypt and retrieve a single item by id. Callable only when unlocked. */
  retrieve(
    id: string,
    masterKey: CryptoKey,
  ): Promise<Record<string, unknown> | null>

  /** Decrypt and list all items of an entity type. Throws if session is locked. */
  list(
    entityType: string,
    masterKey: CryptoKey,
  ): Promise<Array<{ id: string; entityId: string; decrypted: Record<string, unknown> }>>

  /** Delete an item by id. Callable only when unlocked. */
  delete(id: string): Promise<void>

  /** Summary metadata (itemCount, lastModified). Callable when locked — NO plaintext returned. */
  getSummary(): Promise<VaultSummary>

  /** Store the VaultKeyRecord in the isolated vault key store. */
  saveKeyRecord(keyRecord: VaultKeyRecord, id?: string): Promise<void>

  /** Retrieve the VaultKeyRecord from the isolated vault key store. */
  getKeyRecord(id?: string): Promise<VaultKeyRecord | null>
}

export interface VaultRepositoryOptions {
  /** An existing better-sqlite3 Database instance or path */
  db?: any
  /** Optional SQLite file path (default ':memory:') */
  dbPath?: string
  /** The VaultSession to bind to (defaults to singleton vaultSession) */
  session?: VaultSession
  /** Explicitly force in-memory storage (e.g. for browser or environments without native sqlite) */
  inMemory?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper to generate UUIDs
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  throw new Error('A cryptographically secure UUID generator is unavailable.')
}

// ─────────────────────────────────────────────────────────────────────────────
// InMemory Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class InMemoryVaultRepository implements VaultRepository {
  private items = new Map<string, {
    id: string
    entityType: string
    entityId: string
    encryptedPayload: EncryptedPayload
    createdAt: string
    updatedAt: string
  }>()
  private keyRecords = new Map<string, { keyRecord: VaultKeyRecord; createdAt: string }>()
  private session: VaultSession

  constructor(session: VaultSession = vaultSession) {
    this.session = session
  }

  async store(
    entityType: string,
    entityId: string,
    plaintext: Record<string, unknown>,
    masterKey: CryptoKey,
  ): Promise<VaultItem> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot store items.')
    }
    if (!masterKey) {
      throw new Error('Master key is required to encrypt vault items.')
    }

    const jsonText = JSON.stringify(plaintext)
    const encryptedPayload = await encrypt(jsonText, masterKey)
    if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
      throw new Error('Vault session changed during the storage operation.')
    }
    const now = new Date().toISOString()

    // Check if item with this (entityType, entityId) already exists
    let id: string = generateId()
    let createdAt = now

    for (const item of this.items.values()) {
      if (item.entityType === entityType && item.entityId === entityId) {
        id = item.id
        createdAt = item.createdAt
        break
      }
    }

    const record = {
      id,
      entityType,
      entityId,
      encryptedPayload,
      createdAt,
      updatedAt: now,
    }

    this.items.set(id, record)

    return {
      id,
      entityType,
      entityId,
      encryptedPayload,
      iv: encryptedPayload.ivBase64,
      createdAt,
      updatedAt: now,
    }
  }

  async retrieve(
    id: string,
    masterKey: CryptoKey,
  ): Promise<Record<string, unknown> | null> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot retrieve items.')
    }
    if (!masterKey) {
      throw new Error('Master key is required to decrypt vault items.')
    }

    const item = this.items.get(id)
    if (!item) return null

    const decryptedStr = await decrypt(item.encryptedPayload, masterKey)
    if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
      throw new Error('Vault session changed during the retrieval operation.')
    }
    return JSON.parse(decryptedStr) as Record<string, unknown>
  }

  async list(
    entityType: string,
    masterKey: CryptoKey,
  ): Promise<Array<{ id: string; entityId: string; decrypted: Record<string, unknown> }>> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot list items.')
    }
    if (!masterKey) {
      throw new Error('Master key is required to decrypt vault items.')
    }

    const results: Array<{ id: string; entityId: string; decrypted: Record<string, unknown> }> = []
    const matching = Array.from(this.items.values())
      .filter((item) => item.entityType === entityType)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    for (const item of matching) {
      const decryptedStr = await decrypt(item.encryptedPayload, masterKey)
      if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
        throw new Error('Vault session changed during the list operation.')
      }
      const decrypted = JSON.parse(decryptedStr) as Record<string, unknown>
      results.push({
        id: item.id,
        entityId: item.entityId,
        decrypted,
      })
    }

    return results
  }

  async delete(id: string): Promise<void> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot delete items.')
    }
    this.items.delete(id)
  }

  async getSummary(): Promise<VaultSummary> {
    // Callable even when locked — only returns item count and latest updatedAt.
    // NEVER touches payload, never decrypts, never leaks plaintext.
    const count = this.items.size
    let lastModified: string | null = null

    for (const item of this.items.values()) {
      if (!lastModified || item.updatedAt > lastModified) {
        lastModified = item.updatedAt
      }
    }

    return {
      itemCount: count,
      lastModified,
    }
  }

  async saveKeyRecord(keyRecord: VaultKeyRecord, id = 'default'): Promise<void> {
    this.keyRecords.set(id, {
      keyRecord,
      createdAt: new Date().toISOString(),
    })
  }

  async getKeyRecord(id = 'default'): Promise<VaultKeyRecord | null> {
    const record = this.keyRecords.get(id)
    return record ? record.keyRecord : null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser IndexedDB Implementation
// ─────────────────────────────────────────────────────────────────────────────

interface IndexedDbVaultItem {
  id: string
  entityType: string
  entityId: string
  encryptedPayload: EncryptedPayload
  createdAt: string
  updatedAt: string
}

interface IndexedDbKeyRecord {
  id: string
  keyRecord: VaultKeyRecord
  createdAt: string
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
  })
}

function transactionResult(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
  })
}

/**
 * Browser-persistent repository. Only encrypted payloads and the wrapped key
 * record are written to IndexedDB; decrypted values are returned to callers
 * only for the duration of an unlocked session.
 */
export class IndexedDbVaultRepository implements VaultRepository {
  private readonly session: VaultSession
  private databasePromise: Promise<IDBDatabase> | null = null

  constructor(session: VaultSession = vaultSession) {
    this.session = session
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB is unavailable in this environment.'))
          return
        }
        const request = indexedDB.open('grimoire-private', 1)
        request.onupgradeneeded = () => {
          const database = request.result
          if (!database.objectStoreNames.contains('items')) {
            database.createObjectStore('items', { keyPath: 'id' })
          }
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: 'id' })
          }
        }
        request.onsuccess = () => {
          const database = request.result
          database.onversionchange = () => database.close()
          resolve(database)
        }
        request.onerror = () => reject(request.error ?? new Error('Unable to open the private vault database.'))
        request.onblocked = () => reject(new Error('Private vault database upgrade is blocked by another tab.'))
      }).catch((error: unknown) => {
        this.databasePromise = null
        throw error
      })
    }
    return this.databasePromise
  }

  async store(
    entityType: string,
    entityId: string,
    plaintext: Record<string, unknown>,
    masterKey: CryptoKey,
  ): Promise<VaultItem> {
    if (!this.session.isUnlocked()) throw new Error('Vault is locked. Cannot store items.')
    if (!masterKey) throw new Error('Master key is required to encrypt vault items.')
    const encryptedPayload = await encrypt(JSON.stringify(plaintext), masterKey)
    if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
      throw new Error('Vault session changed during the storage operation.')
    }
    const database = await this.openDatabase()
    const id = `${entityType.length}:${entityType}${entityId}`
    const transaction = database.transaction('items', 'readwrite')
    const completed = transactionResult(transaction)
    const store = transaction.objectStore('items')
    const existing = await requestResult(store.get(id)) as IndexedDbVaultItem | undefined
    if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
      await completed
      throw new Error('Vault session changed during the storage operation.')
    }
    const now = new Date().toISOString()
    const record: IndexedDbVaultItem = {
      id,
      entityType,
      entityId,
      encryptedPayload,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    store.put(record)
    await completed
    return {
      ...record,
      iv: encryptedPayload.ivBase64,
    }
  }

  async retrieve(id: string, masterKey: CryptoKey): Promise<Record<string, unknown> | null> {
    if (!this.session.isUnlocked()) throw new Error('Vault is locked. Cannot retrieve items.')
    if (!masterKey) throw new Error('Master key is required to decrypt vault items.')
    const database = await this.openDatabase()
    const transaction = database.transaction('items', 'readonly')
    const completed = transactionResult(transaction)
    const record = await requestResult(
      transaction.objectStore('items').get(id),
    ) as IndexedDbVaultItem | undefined
    await completed
    if (!record) return null
    const decrypted = await decrypt(record.encryptedPayload, masterKey)
    if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
      throw new Error('Vault session changed during the retrieval operation.')
    }
    return JSON.parse(decrypted) as Record<string, unknown>
  }

  async list(
    entityType: string,
    masterKey: CryptoKey,
  ): Promise<Array<{ id: string; entityId: string; decrypted: Record<string, unknown> }>> {
    if (!this.session.isUnlocked()) throw new Error('Vault is locked. Cannot list items.')
    if (!masterKey) throw new Error('Master key is required to decrypt vault items.')
    const database = await this.openDatabase()
    const transaction = database.transaction('items', 'readonly')
    const completed = transactionResult(transaction)
    const records = await requestResult(
      transaction.objectStore('items').getAll(),
    ) as IndexedDbVaultItem[]
    await completed
    const matching = records
      .filter((record) => record.entityType === entityType)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const results = []
    for (const record of matching) {
      if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
        throw new Error('Vault session changed during the list operation.')
      }
      const decrypted = await decrypt(record.encryptedPayload, masterKey)
      if (!this.session.isUnlocked() || this.session.getMasterKey() !== masterKey) {
        throw new Error('Vault session changed during the list operation.')
      }
      results.push({
        id: record.id,
        entityId: record.entityId,
        decrypted: JSON.parse(decrypted) as Record<string, unknown>,
      })
    }
    return results
  }

  async delete(id: string): Promise<void> {
    if (!this.session.isUnlocked()) throw new Error('Vault is locked. Cannot delete items.')
    const database = await this.openDatabase()
    const transaction = database.transaction('items', 'readwrite')
    const completed = transactionResult(transaction)
    transaction.objectStore('items').delete(id)
    await completed
  }

  async getSummary(): Promise<VaultSummary> {
    const database = await this.openDatabase()
    const transaction = database.transaction('items', 'readonly')
    const completed = transactionResult(transaction)
    const records = await requestResult(
      transaction.objectStore('items').getAll(),
    ) as IndexedDbVaultItem[]
    await completed
    return {
      itemCount: records.length,
      lastModified: records.reduce<string | null>(
        (latest, record) => !latest || record.updatedAt > latest ? record.updatedAt : latest,
        null,
      ),
    }
  }

  async saveKeyRecord(keyRecord: VaultKeyRecord, id = 'default'): Promise<void> {
    const database = await this.openDatabase()
    const transaction = database.transaction('keys', 'readwrite')
    const completed = transactionResult(transaction)
    transaction.objectStore('keys').put({ id, keyRecord, createdAt: new Date().toISOString() })
    await completed
  }

  async getKeyRecord(id = 'default'): Promise<VaultKeyRecord | null> {
    const database = await this.openDatabase()
    const transaction = database.transaction('keys', 'readonly')
    const completed = transactionResult(transaction)
    const record = await requestResult(
      transaction.objectStore('keys').get(id),
    ) as IndexedDbKeyRecord | undefined
    await completed
    return record?.keyRecord ?? null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SQLite Implementation (better-sqlite3)
// ─────────────────────────────────────────────────────────────────────────────

export class SqliteVaultRepository implements VaultRepository {
  private db: any
  private session: VaultSession

  constructor(db: any, session: VaultSession = vaultSession) {
    this.db = db
    this.session = session
    this.initSchema()
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vault_items (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        encrypted_payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vault_key_store (
        id TEXT PRIMARY KEY DEFAULT 'default',
        key_record TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_vault_items_type ON vault_items(entity_type);
      CREATE INDEX IF NOT EXISTS idx_vault_items_entity ON vault_items(entity_type, entity_id);
    `)
  }

  async store(
    entityType: string,
    entityId: string,
    plaintext: Record<string, unknown>,
    masterKey: CryptoKey,
  ): Promise<VaultItem> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot store items.')
    }
    if (!masterKey) {
      throw new Error('Master key is required to encrypt vault items.')
    }

    const jsonText = JSON.stringify(plaintext)
    const encryptedPayload = await encrypt(jsonText, masterKey)
    const now = new Date().toISOString()

    const findStmt = this.db.prepare(
      'SELECT id, created_at FROM vault_items WHERE entity_type = ? AND entity_id = ?',
    )
    const existing = findStmt.get(entityType, entityId) as { id: string; created_at: string } | undefined

    let id: string
    let createdAt: string

    if (existing) {
      id = existing.id
      createdAt = existing.created_at
      const updateStmt = this.db.prepare(`
        UPDATE vault_items
        SET encrypted_payload = ?, updated_at = ?
        WHERE id = ?
      `)
      updateStmt.run(JSON.stringify(encryptedPayload), now, id)
    } else {
      id = generateId()
      createdAt = now
      const insertStmt = this.db.prepare(`
        INSERT INTO vault_items (id, entity_type, entity_id, encrypted_payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      insertStmt.run(id, entityType, entityId, JSON.stringify(encryptedPayload), createdAt, now)
    }

    return {
      id,
      entityType,
      entityId,
      encryptedPayload,
      iv: encryptedPayload.ivBase64,
      createdAt,
      updatedAt: now,
    }
  }

  async retrieve(
    id: string,
    masterKey: CryptoKey,
  ): Promise<Record<string, unknown> | null> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot retrieve items.')
    }
    if (!masterKey) {
      throw new Error('Master key is required to decrypt vault items.')
    }

    const stmt = this.db.prepare('SELECT encrypted_payload FROM vault_items WHERE id = ?')
    const row = stmt.get(id) as { encrypted_payload: string } | undefined
    if (!row) return null

    const payload = JSON.parse(row.encrypted_payload) as EncryptedPayload
    const decryptedStr = await decrypt(payload, masterKey)
    return JSON.parse(decryptedStr) as Record<string, unknown>
  }

  async list(
    entityType: string,
    masterKey: CryptoKey,
  ): Promise<Array<{ id: string; entityId: string; decrypted: Record<string, unknown> }>> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot list items.')
    }
    if (!masterKey) {
      throw new Error('Master key is required to decrypt vault items.')
    }

    const stmt = this.db.prepare(
      'SELECT id, entity_id, encrypted_payload FROM vault_items WHERE entity_type = ? ORDER BY updated_at DESC',
    )
    const rows = stmt.all(entityType) as Array<{
      id: string
      entity_id: string
      encrypted_payload: string
    }>

    const results: Array<{ id: string; entityId: string; decrypted: Record<string, unknown> }> = []
    for (const row of rows) {
      const payload = JSON.parse(row.encrypted_payload) as EncryptedPayload
      const decryptedStr = await decrypt(payload, masterKey)
      const decrypted = JSON.parse(decryptedStr) as Record<string, unknown>
      results.push({
        id: row.id,
        entityId: row.entity_id,
        decrypted,
      })
    }

    return results
  }

  async delete(id: string): Promise<void> {
    if (!this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot delete items.')
    }
    const stmt = this.db.prepare('DELETE FROM vault_items WHERE id = ?')
    stmt.run(id)
  }

  async getSummary(): Promise<VaultSummary> {
    // Callable even when locked — only metadata is selected
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count, MAX(updated_at) as lastModified
      FROM vault_items
    `)
    const row = stmt.get() as { count: number; lastModified: string | null } | undefined

    return {
      itemCount: row ? Number(row.count) : 0,
      lastModified: row?.lastModified ?? null,
    }
  }

  async saveKeyRecord(keyRecord: VaultKeyRecord, id = 'default'): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO vault_key_store (id, key_record, created_at)
      VALUES (?, ?, ?)
    `)
    stmt.run(id, JSON.stringify(keyRecord), new Date().toISOString())
  }

  async getKeyRecord(id = 'default'): Promise<VaultKeyRecord | null> {
    const stmt = this.db.prepare('SELECT key_record FROM vault_key_store WHERE id = ?')
    const row = stmt.get(id) as { key_record: string } | undefined
    if (!row) return null
    return JSON.parse(row.key_record) as VaultKeyRecord
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a VaultRepository instance.
 *
 * If `options.db` is provided, wraps that better-sqlite3 database.
 * If `options.inMemory` is true, creates a pure in-memory repository (ideal for tests/browser).
 * Otherwise, attempts to load better-sqlite3 with the given dbPath (default ':memory:'),
 * falling back gracefully to in-memory if better-sqlite3 is unavailable.
 */
export function createVaultRepository(options: VaultRepositoryOptions = {}): VaultRepository {
  const session = options.session ?? vaultSession

  if (options.inMemory) {
    return new InMemoryVaultRepository(session)
  }

  if (options.db) {
    return new SqliteVaultRepository(options.db, session)
  }

  try {
    // Attempt dynamic require of better-sqlite3
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3')
    const db = new Database(options.dbPath || ':memory:')
    return new SqliteVaultRepository(db, session)
  } catch {
    // In-memory fallback
    return new InMemoryVaultRepository(session)
  }
}
