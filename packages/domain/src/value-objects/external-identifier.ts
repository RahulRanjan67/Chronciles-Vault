/**
 * ExternalIdentifier value object.
 *
 * Represents a reference to a Work on an external tracking or aggregator
 * service (e.g. AniList, MyAnimeList, MangaDex, Anidb, VNDB, OpenLibrary).
 * Immutable — create a new object to replace.
 */
export interface ExternalIdentifier {
  /**
   * Well-known short name of the provider.
   *
   * @example 'anilist' | 'myanimelist' | 'mangadex' | 'vndb' | 'openlibrary'
   */
  readonly provider: string;

  /**
   * The external ID as the provider defines it.
   * May be numeric or alphanumeric depending on the provider.
   *
   * @example '101922' | 'one-piece' | 'md:abc123'
   */
  readonly externalId: string;

  /**
   * Optional human-readable URL to the work on the provider's site.
   * Derived/cached — not authoritative.
   */
  readonly url?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a validated ExternalIdentifier value object.
 *
 * @throws {Error} When provider or externalId are empty strings.
 */
export function createExternalIdentifier(
  provider: string,
  externalId: string,
  url?: string,
): ExternalIdentifier {
  if (!provider.trim()) throw new Error('ExternalIdentifier: provider must not be empty');
  if (!externalId.trim()) throw new Error('ExternalIdentifier: externalId must not be empty');
  return { provider: provider.trim().toLowerCase(), externalId: externalId.trim(), url };
}
