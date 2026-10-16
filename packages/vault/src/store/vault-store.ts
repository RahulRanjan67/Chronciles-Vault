import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { vaultSession, type VaultSessionState } from '../session/vault-session.js'
import type { VaultKeyRecord } from '../crypto/vault-key.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultStore {
  // ── Reactive state ────────────────────────────────────────────────────────
  status: 'locked' | 'unlocking' | 'unlocked' | 'locking'
  /** Total count of encrypted items — only non-null while unlocked. */
  itemCount: number | null
  /** Timestamp of the last lock event (ms since epoch). */
  lastLockedAt: number | null
  /** The stored VaultKeyRecord needed to derive wrapping key on unlock. */
  keyRecord: VaultKeyRecord | null

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Unlock the vault with the given passphrase (and optional key record).
   * On success, `status` transitions to 'unlocked' WITHOUT any page reload.
   * Components subscribed to `useVaultStore` will re-render automatically.
   */
  unlock(
    passphrase: string,
    keyRecord?: VaultKeyRecord,
  ): Promise<{ success: boolean; error?: string }>

  /** Activate a new master key created during first-time vault setup. */
  activateMasterKey(masterKey: CryptoKey, keyRecord: VaultKeyRecord): void

  /** Set or update the active VaultKeyRecord. */
  setKeyRecord(record: VaultKeyRecord | null): void

  /**
   * Lock the vault immediately.
   * The master key is discarded from the session closure and `status` transitions
   * to 'locked' WITHOUT any page reload.
   */
  lock(): void

  /** Update the in-store item count (called after repository operations). */
  setItemCount(count: number): void

  // ── Internal ──────────────────────────────────────────────────────────────

  /** Called by the VaultSession subscriber — do not call directly. */
  _syncFromSession(state: VaultSessionState): void
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useVaultStore = create<VaultStore>()(
  subscribeWithSelector((set, get) => {
    // ── Wire the VaultSession → Zustand sync ──────────────────────────────
    // This subscription is set up once at module load time. Whenever the
    // VaultSession changes state, Zustand state is updated synchronously, which
    // causes any component using useVaultStore() to re-render — no reload needed.
    vaultSession.subscribe((sessionState) => {
      get()._syncFromSession(sessionState)
    })

    return {
      // ── Initial state ──────────────────────────────────────────────────
      status: 'locked',
      itemCount: null,
      lastLockedAt: null,
      keyRecord: null,

      // ── Actions ────────────────────────────────────────────────────────

      setKeyRecord: (record) => {
        set({ keyRecord: record })
      },

      unlock: async (passphrase, keyRecord) => {
        // Guard: already unlocked or mid-transition
        const currentStatus = get().status
        if (currentStatus === 'unlocked' || currentStatus === 'unlocking') {
          return { success: true }
        }

        const effectiveKeyRecord = keyRecord ?? get().keyRecord
        if (!effectiveKeyRecord) {
          return { success: false, error: 'Vault key record is required to unlock.' }
        }

        if (keyRecord) {
          set({ keyRecord })
        }

        try {
          // VaultSession.unlock() changes session state → subscriber fires →
          // _syncFromSession() → set({ status: 'unlocked' }) — all synchronous
          // within the microtask queue. No router.refresh(), no reload.
          await vaultSession.unlock(passphrase, effectiveKeyRecord)
          return { success: true }
        } catch {
          // _syncFromSession already set status back to 'locked' via subscriber
          return {
            success: false,
            error: 'Unable to unlock the vault. Check your passphrase and try again.',
          }
        }
      },

      activateMasterKey: (masterKey, keyRecord) => {
        vaultSession.activateMasterKey(masterKey)
        set({ keyRecord })
      },

      lock: () => {
        vaultSession.lock()
        // _syncFromSession handles the state transition reactively
      },

      setItemCount: (count) => {
        set({ itemCount: count })
      },

      // ── Internal sync ──────────────────────────────────────────────────

      _syncFromSession: (sessionState) => {
        switch (sessionState.status) {
          case 'locked':
            set({
              status: 'locked',
              itemCount: null,
              lastLockedAt: Date.now(),
            })
            break

          case 'unlocking':
            set({ status: 'unlocking' })
            break

          case 'unlocked':
            set({ status: 'unlocked' })
            break

          case 'locking':
            set({ status: 'locking' })
            break
        }
      },
    }
  }),
)

// ─────────────────────────────────────────────────────────────────────────────
// Convenience selectors (stable references — safe to use in useCallback deps)
// ─────────────────────────────────────────────────────────────────────────────

export const selectVaultStatus = (s: VaultStore) => s.status
export const selectIsUnlocked = (s: VaultStore) => s.status === 'unlocked'
export const selectItemCount = (s: VaultStore) => s.itemCount
export const selectLastLockedAt = (s: VaultStore) => s.lastLockedAt
