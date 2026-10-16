import { describe, it, expect, beforeEach } from 'vitest'
import {
  createVaultSearchIndex,
  createVaultSession,
  createVaultKey,
  type VaultSession,
  type VaultSearchIndex,
} from '../index.js'

describe('Vault In-Memory Search Index', () => {
  let session: VaultSession
  let searchIndex: VaultSearchIndex

  beforeEach(async () => {
    session = createVaultSession()
    searchIndex = createVaultSearchIndex(session)

    const keyData = await createVaultKey('search-test-pass')
    await session.unlock('search-test-pass', keyData.keyRecord)
  }, 15000)

  it('builds index and searches items with snippet generation', () => {
    searchIndex.build([
      {
        id: 'item-1',
        entityType: 'work',
        text: 'The Brothers Karamazov explores deep moral dilemmas and spiritual faith.',
      },
      {
        id: 'item-2',
        entityType: 'note',
        text: 'Notes on cognitive behavioral psychology and habit loops.',
      },
      {
        id: 'item-3',
        entityType: 'memory',
        text: 'Remembering summer reading by the lake discussing philosophy.',
      },
    ])

    expect(searchIndex.getItemCount()).toBe(3)

    // Search for Karamazov
    const results1 = searchIndex.search('Karamazov')
    expect(results1.length).toBe(1)
    expect(results1[0]?.id).toBe('item-1')
    expect(results1[0]?.entityType).toBe('work')
    expect(results1[0]?.snippet).toContain('Karamazov')

    // Search for psychology
    const results2 = searchIndex.search('psychology')
    expect(results2.length).toBe(1)
    expect(results2[0]?.id).toBe('item-2')
    expect(results2[0]?.snippet).toContain('psychology')

    // Empty search query
    expect(searchIndex.search('')).toEqual([])
    expect(searchIndex.search('   ')).toEqual([])
  })

  it('Invariant 4: In-memory search index is cleared on lock', () => {
    searchIndex.build([
      {
        id: 'secret-1',
        entityType: 'note',
        text: 'Top secret private journal entry.',
      },
    ])
    expect(searchIndex.getItemCount()).toBe(1)

    // Locking the session must clear the index automatically via subscriber
    session.lock()

    expect(searchIndex.getItemCount()).toBe(0)
    // Attempting to search when locked throws
    expect(() => searchIndex.search('secret')).toThrow('Vault is locked')
  })

  it('throws error when building index if session is locked', () => {
    session.lock()
    expect(() =>
      searchIndex.build([
        {
          id: 'item-1',
          entityType: 'work',
          text: 'Some private text',
        },
      ]),
    ).toThrow('Vault is locked')
  })

  it('explicit clear() removes all items and tokens', () => {
    searchIndex.build([
      {
        id: 'item-1',
        entityType: 'note',
        text: 'Temporary data',
      },
    ])
    expect(searchIndex.getItemCount()).toBe(1)

    searchIndex.clear()
    expect(searchIndex.getItemCount()).toBe(0)
    expect(searchIndex.search('Temporary')).toEqual([])
  })
})
