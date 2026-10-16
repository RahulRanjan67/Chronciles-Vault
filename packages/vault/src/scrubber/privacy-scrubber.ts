// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PrivacyLevel = 'public' | 'normal' | 'private' | 'vault' | 'unlisted' | string

export interface ScrubSafetyFlags {
  /** True if the vault was unlocked when scrubbed */
  readonly isUnlocked: boolean
  /** True if the original item had private or vault privacy state */
  readonly isPrivate: boolean
  /** True if any field or tag was scrubbed / redacted */
  readonly scrubbed: boolean
  /** List of field names that were masked or redacted */
  readonly maskedFields?: readonly string[]
}

export interface PrivacyScrubberOptions {
  /** If true, return a masked placeholder instead of null for private records when locked */
  returnPlaceholder?: boolean
  /** Alias for returnPlaceholder: returns masked placeholder instead of null when locked */
  mask?: boolean
  /** Custom predicate to identify private tags */
  isPrivateTag?: (tag: string) => boolean
  /** Custom placeholder title for masked works/memories */
  placeholderTitle?: string
  /** Custom placeholder description/body */
  placeholderBody?: string
}

export interface Work {
  readonly id: string
  readonly title: string
  readonly privacyState?: PrivacyLevel
  readonly tags?: readonly string[] | string[]
  readonly genres?: readonly string[] | string[]
  readonly description?: string | null
  readonly coverRef?: string | null
  readonly [key: string]: unknown
}

export interface Memory {
  readonly id: string
  readonly title?: string | null
  readonly body?: string | null
  readonly type?: string
  readonly privacyState?: PrivacyLevel
  readonly tags?: readonly string[] | string[]
  readonly assets?: readonly unknown[] | unknown[]
  readonly [key: string]: unknown
}

export type WorkLike = Work
export type MemoryLike = Memory

export type ScrubbedWork<T extends Work = Work> = T & {
  readonly _safety: ScrubSafetyFlags
}

export type ScrubbedMemory<T extends Memory = Memory> = T & {
  readonly _safety: ScrubSafetyFlags
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag Scrubber
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PRIVATE_TAG_PREFIXES = ['private:', 'vault:', 'secret:', '.', '_private:']
const DEFAULT_PRIVATE_TAG_NAMES = new Set([
  'private',
  'vault',
  'secret',
  'nsfw',
  'confidential',
  'hidden',
  'personal',
])

/**
 * Returns true if the given tag is designated as private/vault-only.
 */
export function isPrivateTag(tag: string, customPredicate?: (tag: string) => boolean): boolean {
  if (customPredicate && customPredicate(tag)) {
    return true
  }

  const clean = tag.trim().replace(/^#/, '')
  const normalized = clean.toLowerCase()
  if (DEFAULT_PRIVATE_TAG_NAMES.has(normalized)) {
    return true
  }

  for (const prefix of DEFAULT_PRIVATE_TAG_PREFIXES) {
    if (normalized.startsWith(prefix) || clean.toLowerCase().startsWith(prefix)) {
      return true
    }
  }

  return false
}

/**
 * Returns true if privacyState is private or vault.
 */
export function isPrivateState(privacyState?: PrivacyLevel): boolean {
  if (!privacyState) return false
  const state = privacyState.toLowerCase()
  return state === 'private' || state === 'vault'
}

/**
 * Scrub a list of tags.
 * - When isUnlocked is true: passes through all tags untouched.
 * - When isUnlocked is false: strips all private tags.
 */
export function scrubTags(
  tags: readonly string[] | string[] | undefined | null,
  isUnlocked: boolean,
  options?: PrivacyScrubberOptions,
): readonly string[] {
  if (!tags || tags.length === 0) {
    return []
  }

  if (isUnlocked) {
    return [...tags]
  }

  return tags.filter((tag) => !isPrivateTag(tag, options?.isPrivateTag))
}

/**
 * Alias for scrubTags for backwards compatibility.
 */
export const scrubTagList = scrubTags

// ─────────────────────────────────────────────────────────────────────────────
// Text Masking
// ─────────────────────────────────────────────────────────────────────────────

const SENSITIVE_MEMORY_TYPES = new Set([
  'personal_note',
  'diary',
  'why_stopped',
  'why_saved',
])

/**
 * Mask inline sensitive blocks like [private]...[/private], [vault]...[/vault],
 * or ||private:...|| in text.
 */
export function maskSensitiveText(text: string | null | undefined): string | null {
  if (!text) return text ?? null

  return text
    // Replace [private]...[/private] and [vault]...[/vault] blocks
    .replace(/\[(private|vault)\][\s\S]*?\[\/(private|vault)\]/gi, '[Private Note Encrypted]')
    // Replace markdown inline privacy tags ||private: ...|| and ||vault: ...||
    .replace(/\|\|(private|vault):[\s\S]*?\|\|/gi, '[Private Content]')
}

// ─────────────────────────────────────────────────────────────────────────────
// Work Scrubber
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure privacy scrubber function for Work entities.
 *
 * Rules:
 * - If vault is locked (isUnlocked === false):
 *   - records with privacyState = 'private' or 'vault' return null (or masked placeholder).
 *   - public records have private tags removed from tags & genres.
 *   - sensitive inline blocks in description are masked.
 * - If vault is unlocked (isUnlocked === true):
 *   - unencrypted/decrypted content is passed through with safety flags.
 */
export function scrubWork<T extends Work = Work>(
  work: T,
  isUnlocked: boolean,
  options?: PrivacyScrubberOptions,
): ScrubbedWork<T> | null {
  const isPrivate = isPrivateState(work.privacyState)
  const shouldMask = options?.returnPlaceholder || options?.mask

  if (!isUnlocked) {
    // Vault is locked:
    if (isPrivate) {
      if (shouldMask) {
        return {
          ...work,
          title: options?.placeholderTitle ?? '[Protected Work]',
          description: options?.placeholderBody ?? '[Private content encrypted in vault]',
          coverRef: null,
          tags: [],
          genres: [],
          _safety: {
            isUnlocked: false,
            isPrivate: true,
            scrubbed: true,
            maskedFields: ['title', 'description', 'coverRef', 'tags', 'genres'],
          },
        }
      }
      return null
    }

    // Public / normal work: scrub private tags, genres, and sensitive text in description
    const originalTags = work.tags ?? []
    const originalGenres = work.genres ?? []
    const cleanTags = scrubTags(originalTags, false, options)
    const cleanGenres = scrubTags(originalGenres, false, options)

    const tagsScrubbed = cleanTags.length !== originalTags.length
    const genresScrubbed = cleanGenres.length !== originalGenres.length
    const maskedFields: string[] = []

    if (tagsScrubbed) maskedFields.push('tags')
    if (genresScrubbed) maskedFields.push('genres')

    let scrubbedDescription = work.description
    if (work.description) {
      const masked = maskSensitiveText(work.description)
      if (masked !== work.description) {
        scrubbedDescription = masked
        maskedFields.push('description')
      }
    }

    return {
      ...work,
      title: work.title,
      description: scrubbedDescription,
      tags: cleanTags,
      genres: cleanGenres,
      _safety: {
        isUnlocked: false,
        isPrivate: false,
        scrubbed: maskedFields.length > 0,
        ...(maskedFields.length > 0 ? { maskedFields } : {}),
      },
    }
  }

  // Vault is unlocked: pass through content with safety flags
  return {
    ...work,
    _safety: {
      isUnlocked: true,
      isPrivate,
      scrubbed: false,
    },
  }
}

/**
 * Batch scrub a collection of works, automatically omitting null records when locked.
 */
export function scrubWorkList<T extends Work = Work>(
  works: readonly T[] | T[],
  isUnlocked: boolean,
  options?: PrivacyScrubberOptions,
): ScrubbedWork<T>[] {
  const results: ScrubbedWork<T>[] = []
  for (const work of works) {
    const scrubbed = scrubWork(work, isUnlocked, options)
    if (scrubbed !== null) {
      results.push(scrubbed)
    }
  }
  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory Scrubber
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure privacy scrubber function for Memory entities.
 *
 * Rules:
 * - If vault is locked (isUnlocked === false):
 *   - records with privacyState = 'private' or 'vault' return null (or placeholder).
 *   - private tags are removed.
 *   - sensitive notes (e.g. personal_note, diary, or masked blocks) are masked.
 * - If vault is unlocked (isUnlocked === true):
 *   - unencrypted/decrypted content is passed through with safety flags.
 */
export function scrubMemory<T extends Memory = Memory>(
  memory: T,
  isUnlocked: boolean,
  options?: PrivacyScrubberOptions,
): ScrubbedMemory<T> | null {
  const isPrivate = isPrivateState(memory.privacyState)
  const shouldMask = options?.returnPlaceholder || options?.mask

  if (!isUnlocked) {
    // Vault is locked:
    if (isPrivate) {
      if (shouldMask) {
        return {
          ...memory,
          title: options?.placeholderTitle ?? '[Protected Memory]',
          body: options?.placeholderBody ?? '[Private memory encrypted in vault]',
          tags: [],
          assets: [],
          _safety: {
            isUnlocked: false,
            isPrivate: true,
            scrubbed: true,
            maskedFields: ['title', 'body', 'tags', 'assets'],
          },
        }
      }
      return null
    }

    // Normal / public memory:
    const originalTags = memory.tags ?? []
    const cleanTags = scrubTags(originalTags, false, options)
    const tagsScrubbed = cleanTags.length !== originalTags.length

    const maskedFields: string[] = []
    let scrubbedBody = memory.body
    let scrubbedTitle = memory.title

    // Mask sensitive notes if memory type is personal or contains private markers
    const isSensitiveType = memory.type ? SENSITIVE_MEMORY_TYPES.has(memory.type) : false

    if (isSensitiveType) {
      scrubbedBody = '[Sensitive personal note hidden while vault is locked]'
      maskedFields.push('body')
    } else if (memory.body) {
      const masked = maskSensitiveText(memory.body)
      if (masked !== memory.body) {
        scrubbedBody = masked
        maskedFields.push('body')
      }
    }

    if (memory.title) {
      const maskedTitle = maskSensitiveText(memory.title)
      if (maskedTitle !== memory.title) {
        scrubbedTitle = maskedTitle
        maskedFields.push('title')
      }
    }

    if (tagsScrubbed) {
      maskedFields.push('tags')
    }

    return {
      ...memory,
      title: scrubbedTitle,
      body: scrubbedBody,
      tags: cleanTags,
      _safety: {
        isUnlocked: false,
        isPrivate: false,
        scrubbed: maskedFields.length > 0,
        ...(maskedFields.length > 0 ? { maskedFields } : {}),
      },
    }
  }

  // Vault is unlocked: pass through content with safety flags
  return {
    ...memory,
    _safety: {
      isUnlocked: true,
      isPrivate,
      scrubbed: false,
    },
  }
}

/**
 * Batch scrub a collection of memories, automatically omitting null records when locked.
 */
export function scrubMemoryList<T extends Memory = Memory>(
  memories: readonly T[] | T[],
  isUnlocked: boolean,
  options?: PrivacyScrubberOptions,
): ScrubbedMemory<T>[] {
  const results: ScrubbedMemory<T>[] = []
  for (const memory of memories) {
    const scrubbed = scrubMemory(memory, isUnlocked, options)
    if (scrubbed !== null) {
      results.push(scrubbed)
    }
  }
  return results
}
