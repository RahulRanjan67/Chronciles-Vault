import { unlockVaultKey, type VaultKeyRecord } from '../crypto/vault-key.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VaultStatus = 'locked' | 'unlocking' | 'unlocked' | 'locking'

export type VaultSessionState =
  | { status: 'locked' }
  | { status: 'unlocking' }
  | { status: 'unlocked'; masterKey: CryptoKey; unlockedAt: number }
  | { status: 'locking' }

export interface VaultSession {
  /** Get full internal state (consumers should prefer getStatus/isUnlocked/getMasterKey). */
  getState(): VaultSessionState
  getStatus(): VaultStatus
  isUnlocked(): boolean
  /**
   * Returns the live master CryptoKey when unlocked, null otherwise.
   * This is the ONLY way to obtain the master key — it is never stored in
   * any serialisable structure.
   */
  getMasterKey(): CryptoKey | null

  /**
   * Unlock the vault by deriving the key from the passphrase and stored
   * key record. Throws on wrong passphrase.
   */
  unlock(passphrase: string, keyRecord: VaultKeyRecord): Promise<void>

  /** Activate a freshly generated non-extractable master key without deriving it again. */
  activateMasterKey(masterKey: CryptoKey): void

  /** Immediately discard the master key and transition to locked. */
  lock(): void

  /** Subscribe to session state changes. Returns an unsubscribe function. */
  subscribe(listener: (state: VaultSessionState) => void): () => void

  /** Call on any user activity to reset the auto-lock timer. */
  resetActivityTimer(): void

  /**
   * Set an auto-lock timeout in ms (pass null to disable).
   * After the timeout elapses with no activity, the vault locks automatically.
   */
  setAutoLockTimeout(ms: number | null): void
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new VaultSession instance.
 *
 * The session object is a plain JS object (NOT a Zustand store). It manages
 * a private closure around the master key so the key can never be serialised
 * or accessed without going through the controlled `getMasterKey()` method.
 *
 * External reactive integration is done through the subscribe() method, which
 * the Zustand vault-store calls to sync its own state.
 */
export function createVaultSession(): VaultSession {
  let _state: VaultSessionState = { status: 'locked' }
  const _listeners = new Set<(state: VaultSessionState) => void>()
  let _autoLockTimeoutMs: number | null = null
  let _autoLockTimerId: ReturnType<typeof setTimeout> | null = null

  function _setState(next: VaultSessionState): void {
    _state = next
    for (const listener of _listeners) {
      listener(next)
    }
  }

  function _clearAutoLockTimer(): void {
    if (_autoLockTimerId !== null) {
      clearTimeout(_autoLockTimerId)
      _autoLockTimerId = null
    }
  }

  function _scheduleAutoLock(): void {
    _clearAutoLockTimer()
    if (_autoLockTimeoutMs !== null && _state.status === 'unlocked') {
      _autoLockTimerId = setTimeout(() => {
        session.lock()
      }, _autoLockTimeoutMs)
    }
  }

  const session: VaultSession = {
    getState: () => _state,

    getStatus: () => _state.status,

    isUnlocked: () => _state.status === 'unlocked',

    getMasterKey: () => {
      if (_state.status === 'unlocked') {
        return _state.masterKey
      }
      return null
    },

    unlock: async (passphrase: string, keyRecord: VaultKeyRecord): Promise<void> => {
      if (_state.status === 'unlocked' || _state.status === 'unlocking') return

      _setState({ status: 'unlocking' })
      try {
        const masterKey = await unlockVaultKey(passphrase, keyRecord)
        _setState({ status: 'unlocked', masterKey, unlockedAt: Date.now() })
        _scheduleAutoLock()
      } catch (err) {
        // Restore locked state — do NOT expose the error detail (wrong pass)
        _setState({ status: 'locked' })
        throw err
      }
    },

    activateMasterKey: (masterKey): void => {
      if (_state.status === 'unlocked' || _state.status === 'unlocking') return
      if (
        masterKey.type !== 'secret' ||
        masterKey.extractable ||
        masterKey.algorithm.name !== 'AES-GCM' ||
        !masterKey.usages.includes('encrypt') ||
        !masterKey.usages.includes('decrypt')
      ) {
        throw new Error('Vault master key must be a non-extractable AES-GCM key.')
      }
      _setState({ status: 'unlocked', masterKey, unlockedAt: Date.now() })
      _scheduleAutoLock()
    },

    lock: (): void => {
      if (_state.status === 'locked') return
      _clearAutoLockTimer()
      _setState({ status: 'locking' })
      // Synchronous — no async work needed; CryptoKey is GC'd by the engine.
      _setState({ status: 'locked' })
    },

    subscribe: (listener) => {
      _listeners.add(listener)
      return () => {
        _listeners.delete(listener)
      }
    },

    resetActivityTimer: (): void => {
      if (_state.status === 'unlocked') {
        _scheduleAutoLock()
      }
    },

    setAutoLockTimeout: (ms): void => {
      _autoLockTimeoutMs = ms
      _scheduleAutoLock()
    },
  }

  return session
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton — one session per JS context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The global VaultSession singleton.
 * Import this directly; do NOT create additional sessions.
 */
export const vaultSession: VaultSession = createVaultSession()
