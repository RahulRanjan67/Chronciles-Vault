import { vaultSession, type VaultSession } from '../session/vault-session.js'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultIndexableItem {
  id: string
  text: string
  entityType: string
}

export interface VaultSearchResult {
  id: string
  entityType: string
  snippet: string
}

export interface VaultSearchIndex {
  /** Build index from decrypted vault items. Callable only when unlocked. */
  build(items: VaultIndexableItem[]): void

  /** Search across decrypted vault items. Only call when unlocked. */
  search(query: string): VaultSearchResult[]

  /** Immediately wipe all items and indices from memory. */
  clear(): void

  /** Get number of items currently in the index (0 when locked/cleared). */
  getItemCount(): number
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class InMemoryVaultSearchIndex implements VaultSearchIndex {
  private items: VaultIndexableItem[] = []
  private invertedIndex = new Map<string, Set<number>>()
  private session: VaultSession | null = null
  private unsubscribe: (() => void) | null = null

  constructor(session: VaultSession | null = vaultSession) {
    this.session = session

    if (this.session) {
      // Auto-clear on lock: Whenever vault status becomes 'locked', wipe memory
      this.unsubscribe = this.session.subscribe((state) => {
        if (state.status === 'locked') {
          this.clear()
        }
      })
    }
  }

  /**
   * Build the in-memory search index.
   * Clears any previous items first.
   */
  build(items: VaultIndexableItem[]): void {
    if (this.session && !this.session.isUnlocked()) {
      throw new Error('Vault is locked. Cannot build search index.')
    }

    this.clear()

    // Store a shallow copy
    this.items = items.map((item) => ({
      id: item.id,
      text: item.text,
      entityType: item.entityType,
    }))

    // Build inverted index for fast token matching
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]!
      const tokens = this.tokenize(item.text)
      for (const token of tokens) {
        let set = this.invertedIndex.get(token)
        if (!set) {
          set = new Set<number>()
          this.invertedIndex.set(token, set)
        }
        set.add(i)
      }
    }
  }

  /**
   * Search in-memory index for a query.
   * Throws if vault is locked.
   */
  search(query: string): VaultSearchResult[] {
    if (this.session && !this.session.isUnlocked()) {
      throw new Error('Vault is locked. Search index unavailable.')
    }

    const trimmed = query.trim()
    if (!trimmed || this.items.length === 0) {
      return []
    }

    const queryLower = trimmed.toLowerCase()
    const queryTokens = this.tokenize(trimmed)

    // Score items based on exact substring and token matches
    const scored: Array<{ item: VaultIndexableItem; score: number }> = []

    for (const item of this.items) {
      const textLower = item.text.toLowerCase()
      let score = 0

      // Exact phrase match bonus
      if (textLower.includes(queryLower)) {
        score += 100
      }

      // Token matches
      for (const qToken of queryTokens) {
        if (textLower.includes(qToken)) {
          score += 10
        }
      }

      if (score > 0) {
        scored.push({ item, score })
      }
    }

    // Sort descending by relevance score
    scored.sort((a, b) => b.score - a.score)

    // Format results with relevant snippets
    return scored.map(({ item }) => ({
      id: item.id,
      entityType: item.entityType,
      snippet: this.extractSnippet(item.text, trimmed),
    }))
  }

  /**
   * Wipe all index structures and decrypted item text from memory.
   */
  clear(): void {
    this.items = []
    this.invertedIndex.clear()
  }

  /**
   * Return number of indexed items.
   */
  getItemCount(): number {
    return this.items.length
  }

  /**
   * Cleanup subscription if destroying instance.
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    this.clear()
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9_]+/i)
      .filter((t) => t.length > 1)
  }

  private extractSnippet(text: string, query: string): string {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    let matchIndex = textLower.indexOf(queryLower)

    // If exact query not found, search for first matching token
    if (matchIndex === -1) {
      const tokens = this.tokenize(query)
      for (const token of tokens) {
        matchIndex = textLower.indexOf(token)
        if (matchIndex !== -1) break
      }
    }

    // Default to start of string if still no match found
    if (matchIndex === -1) {
      const slice = text.slice(0, 100).trim()
      return slice.length < text.length ? `${slice}...` : slice
    }

    const start = Math.max(0, matchIndex - 35)
    const end = Math.min(text.length, matchIndex + query.length + 55)

    const prefix = start > 0 ? '...' : ''
    const suffix = end < text.length ? '...' : ''
    const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim()

    return `${prefix}${snippet}${suffix}`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory and Singleton
// ─────────────────────────────────────────────────────────────────────────────

export function createVaultSearchIndex(session: VaultSession | null = vaultSession): VaultSearchIndex {
  return new InMemoryVaultSearchIndex(session)
}

/**
 * Singleton search index bound to the global vaultSession.
 * Automatically cleared whenever vaultSession locks.
 */
export const vaultSearchIndex: VaultSearchIndex = createVaultSearchIndex(vaultSession)
