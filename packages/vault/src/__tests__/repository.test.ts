import { describe, it, expect, beforeEach } from 'vitest'
import {
  createVaultRepository,
  createVaultSession,
  createVaultKey,
  type VaultRepository,
  type VaultSession,
} from '../index.js'

describe('Vault Repository', () => {
  let session: VaultSession
  let repo: VaultRepository
  let masterKey: CryptoKey

  beforeEach(async () => {
    session = createVaultSession()
    repo = createVaultRepository({ session, inMemory: true })

    const keyData = await createVaultKey('repo-test-pass')
    await repo.saveKeyRecord(keyData.keyRecord)
    await session.unlock('repo-test-pass', keyData.keyRecord)
    masterKey = session.getMasterKey()!
  }, 15000)

  it('stores and retrieves encrypted records', async () => {
    const itemData = {
      title: 'Secret Reading Reflection',
      body: 'Thoughts on Crime and Punishment',
      tags: ['dostoevsky', 'reflection'],
    }

    const storedItem = await repo.store('work', 'work-101', itemData, masterKey)
    expect(storedItem.id).toBeDefined()
    expect(storedItem.entityType).toBe('work')
    expect(storedItem.entityId).toBe('work-101')
    expect(storedItem.iv).toBeDefined()
    expect(storedItem.encryptedPayload).toBeDefined()

    // Retrieve by ID
    const retrieved = await repo.retrieve(storedItem.id, masterKey)
    expect(retrieved).toEqual(itemData)
  })

  it('lists items of an entity type decrypted', async () => {
    await repo.store('note', 'note-1', { text: 'First secret note' }, masterKey)
    await repo.store('note', 'note-2', { text: 'Second secret note' }, masterKey)
    await repo.store('memory', 'mem-1', { memory: 'Vault memory' }, masterKey)

    const notes = await repo.list('note', masterKey)
    expect(notes.length).toBe(2)
    expect(notes.some((n) => n.decrypted.text === 'First secret note')).toBe(true)
    expect(notes.some((n) => n.decrypted.text === 'Second secret note')).toBe(true)

    const memories = await repo.list('memory', masterKey)
    expect(memories.length).toBe(1)
    expect(memories[0]?.decrypted.memory).toBe('Vault memory')
  })

  it('deletes an item by id', async () => {
    const item = await repo.store('source', 'src-1', { url: 'https://secret.com' }, masterKey)
    expect(await repo.retrieve(item.id, masterKey)).not.toBeNull()

    await repo.delete(item.id)
    expect(await repo.retrieve(item.id, masterKey)).toBeNull()
  })

  it('Invariant 2: getSummary() returns only counts and timestamps, never plaintext', async () => {
    await repo.store('work', 'w1', { sensitive: 'super confidential text' }, masterKey)
    await repo.store('work', 'w2', { sensitive: 'another private note' }, masterKey)

    // Lock the session
    session.lock()
    expect(session.isUnlocked()).toBe(false)

    // Callable when locked!
    const summary = await repo.getSummary()
    expect(summary.itemCount).toBe(2)
    expect(summary.lastModified).toBeDefined()
    // Ensure no plaintext keys exist on summary
    expect(Object.keys(summary)).toEqual(['itemCount', 'lastModified'])
  })

  it('Invariant 3: list() throws if session is locked', async () => {
    await repo.store('work', 'w1', { data: 'test' }, masterKey)

    // Lock session
    session.lock()
    expect(session.isUnlocked()).toBe(false)

    // Must throw when locked
    await expect(repo.list('work', masterKey)).rejects.toThrow('Vault is locked')
  })

  it('store(), retrieve(), and delete() throw if session is locked', async () => {
    const item = await repo.store('work', 'w1', { data: 'test' }, masterKey)

    session.lock()

    await expect(repo.store('work', 'w2', { data: 'test 2' }, masterKey)).rejects.toThrow(
      'Vault is locked',
    )
    await expect(repo.retrieve(item.id, masterKey)).rejects.toThrow('Vault is locked')
    await expect(repo.delete(item.id)).rejects.toThrow('Vault is locked')
  })

  it('persists and retrieves key record via saveKeyRecord / getKeyRecord', async () => {
    const { keyRecord } = await createVaultKey('persisted-key')
    await repo.saveKeyRecord(keyRecord, 'custom-id')

    const loaded = await repo.getKeyRecord('custom-id')
    expect(loaded).toEqual(keyRecord)
  }, 15000)
})
