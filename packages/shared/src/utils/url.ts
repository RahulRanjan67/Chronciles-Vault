/**
 * URL normalisation utilities.
 *
 * Provides consistent transformations for URLs used in access paths, external
 * identifiers, and capture provenances.  Pure functions — no side effects.
 */

/**
 * Normalise a URL string to a canonical form:
 * - Strips trailing slashes from the pathname
 * - Lowercases the protocol and host
 * - Removes the default port if present (80 for http, 443 for https)
 * - Removes the fragment (#hash)
 *
 * Returns `null` if the input is not a valid URL.
 *
 * @example
 *   normalizeUrl('HTTPS://Example.Com/foo/') // => 'https://example.com/foo'
 */
export function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  // Strip fragment
  url.hash = '';

  // Strip default ports
  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = '';
  }

  // Remove trailing slash from pathname (unless it's just "/")
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

/**
 * Attempt to parse a raw string as a URL and return a URL object.
 * Returns `null` when the string is not a valid absolute URL.
 */
export function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

/**
 * Return the origin (scheme + host + port) of a URL string,
 * or `null` if the input is invalid.
 *
 * @example
 *   extractOrigin('https://mangadex.org/chapter/123') // => 'https://mangadex.org'
 */
export function extractOrigin(raw: string): string | null {
  const url = parseUrl(raw);
  return url ? url.origin : null;
}

/**
 * Return true if the given string is a syntactically valid absolute URL
 * (http or https only).
 */
export function isHttpUrl(raw: string): boolean {
  const url = parseUrl(raw);
  return url !== null && (url.protocol === 'http:' || url.protocol === 'https:');
}

/**
 * Return true if the string looks like a local file path (absolute) on
 * Windows or POSIX.  This is intentionally lenient — it does not verify
 * that the path exists on disk.
 */
export function isLocalPath(raw: string): boolean {
  const trimmed = raw.trim();
  // POSIX absolute path
  if (trimmed.startsWith('/')) return true;
  // Windows absolute path: C:\ or C:/
  if (/^[A-Za-z]:[/\\]/.test(trimmed)) return true;
  // UNC path \\server\share
  if (trimmed.startsWith('\\\\')) return true;
  return false;
}

/**
 * Join a base URL and a relative path segment safely.
 * Returns `null` if the base is not a valid URL.
 *
 * @example
 *   joinUrl('https://example.com/api', '/chapters/1') // => 'https://example.com/chapters/1'
 */
export function joinUrl(base: string, path: string): string | null {
  try {
    return new URL(path, base).toString();
  } catch {
    return null;
  }
}
