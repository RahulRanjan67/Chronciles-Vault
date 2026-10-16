import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createVaultSession,
  createVaultKey,
  useVaultStore,
} from '../index.js'

describe('Vault Session & Reactive Store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Invariant 1: getMasterKey() returns null when locked', () => {
    const session = createVaultSession()
    expect(session.getStatus()).toBe('locked')
    expect(session.isUnlocked()).toBe(false)
    expect(session.getMasterKey()).toBeNull()
  })

  it('activates a newly generated non-extractable key without a second KDF pass', async () => {
    vi.useRealTimers()
    const session = createVaultSession()
    const { masterKey } = await createVaultKey('new-vault-activation-pass')

    session.activateMasterKey(masterKey)
    expect(session.isUnlocked()).toBe(true)
    expect(session.getMasterKey()).toBe(masterKey)

    session.lock()
    expect(session.getMasterKey()).toBeNull()
  }, 15000)

  it('unlocks reactively and provides masterKey only while unlocked', async () => {
    vi.useRealTimers() // Argon2id needs real time
    const session = createVaultSession()
    const { keyRecord } = await createVaultKey('test-pass')

    const states: string[] = []
    const unsub = session.subscribe((s) => states.push(s.status))

    expect(session.isUnlocked()).toBe(false)
    expect(session.getMasterKey()).toBeNull()

    // Unlock
    await session.unlock('test-pass', keyRecord)

    expect(session.isUnlocked()).toBe(true)
    expect(session.getStatus()).toBe('unlocked')
    expect(session.getMasterKey()).toBeInstanceOf(CryptoKey)
    expect(states).toContain('unlocking')
    expect(states).toContain('unlocked')

    // Lock
    session.lock()

    expect(session.isUnlocked()).toBe(false)
    expect(session.getStatus()).toBe('locked')
    expect(session.getMasterKey()).toBeNull() // Invariant 1 preserved
    expect(states).toContain('locked')

    unsub()
  }, 15000)

  it('auto-lock fires after configured inactivity duration', async () => {
    vi.useRealTimers()
    const session = createVaultSession()
    const { keyRecord } = await createVaultKey('auto-lock-pass')
    await session.unlock('auto-lock-pass', keyRecord)
    expect(session.isUnlocked()).toBe(true)

    // Set auto-lock timeout to 50ms
    session.setAutoLockTimeout(50)

    // Wait 100ms
    await new Promise((r) => setTimeout(r, 100))

    expect(session.isUnlocked()).toBe(false)
    expect(session.getStatus()).toBe('locked')
    expect(session.getMasterKey()).toBeNull()
  }, 15000)

  it('Zustand store synchronizes reactively with VaultSession without page reload', async () => {
    vi.useRealTimers()
    const { keyRecord } = await createVaultKey('store-sync-pass')

    // Store is initially locked
    useVaultStore.getState().lock()
    expect(useVaultStore.getState().status).toBe('locked')

    // Track state transitions
    const storeStatuses: string[] = []
    const unsubStore = useVaultStore.subscribe((s) => storeStatuses.push(s.status))

    // Call store.unlock()
    const result = await useVaultStore.getState().unlock('store-sync-pass', keyRecord)
    expect(result.success).toBe(true)
    expect(useVaultStore.getState().status).toBe('unlocked')
    expect(storeStatuses).toContain('unlocked')

    // Set item count
    useVaultStore.getState().setItemCount(15)
    expect(useVaultStore.getState().itemCount).toBe(15)

    // Call store.lock()
    useVaultStore.getState().lock()
    expect(useVaultStore.getState().status).toBe('locked')
    expect(useVaultStore.getState().itemCount).toBeNull() // Cleared on lock
    expect(useVaultStore.getState().lastLockedAt).toBeTypeOf('number')

    unsubStore()
  }, 15000)
})
