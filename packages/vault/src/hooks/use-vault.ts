import { useCallback } from 'react'
import {
  useVaultStore,
  selectVaultStatus,
  selectIsUnlocked,
  selectItemCount,
  selectLastLockedAt,
} from '../store/vault-store.js'
import type { VaultStatus } from '../session/vault-session.js'
import type { VaultKeyRecord } from '../crypto/vault-key.js'

// ─────────────────────────────────────────────────────────────────────────────
// Individual Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current Vault status reactively.
 * Status values: 'locked' | 'unlocking' | 'unlocked' | 'locking'
 */
export function useVaultStatus(): VaultStatus {
  return useVaultStore(selectVaultStatus)
}

/**
 * Returns true if the vault is currently unlocked, false otherwise.
 * Re-renders reactively upon unlock/lock WITHOUT page reload.
 */
export function useIsVaultUnlocked(): boolean {
  return useVaultStore(selectIsUnlocked)
}

/**
 * Returns a stable unlock callback.
 * Pass the passphrase (and optional keyRecord if not already set in store).
 */
export function useVaultUnlock(): (
  passphrase: string,
  keyRecord?: VaultKeyRecord,
) => Promise<{ success: boolean; error?: string }> {
  const unlock = useVaultStore((s) => s.unlock)
  return useCallback(
    (passphrase: string, keyRecord?: VaultKeyRecord) => unlock(passphrase, keyRecord),
    [unlock],
  )
}

/**
 * Returns a stable lock callback.
 * Immediately transitions session and store to 'locked' WITHOUT page reload.
 */
export function useVaultLock(): () => void {
  const lock = useVaultStore((s) => s.lock)
  return useCallback(() => {
    lock()
  }, [lock])
}

/**
 * Returns vault metadata summary reactively.
 */
export function useVaultSummary(): {
  status: VaultStatus
  isUnlocked: boolean
  itemCount: number | null
  lastLockedAt: number | null
} {
  const status = useVaultStore(selectVaultStatus)
  const isUnlocked = useVaultStore(selectIsUnlocked)
  const itemCount = useVaultStore(selectItemCount)
  const lastLockedAt = useVaultStore(selectLastLockedAt)

  return {
    status,
    isUnlocked,
    itemCount,
    lastLockedAt,
  }
}

/**
 * Composite hook returning all vault status and action helpers.
 */
export function useVault() {
  const status = useVaultStatus()
  const isUnlocked = useIsVaultUnlocked()
  const unlock = useVaultUnlock()
  const lock = useVaultLock()
  const summary = useVaultSummary()
  const setKeyRecord = useVaultStore((s) => s.setKeyRecord)
  const keyRecord = useVaultStore((s) => s.keyRecord)

  return {
    status,
    isUnlocked,
    unlock,
    lock,
    summary,
    keyRecord,
    setKeyRecord,
  }
}
