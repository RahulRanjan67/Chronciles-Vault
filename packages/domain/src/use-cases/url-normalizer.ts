/**
 * URL Normalizer Use Case
 *
 * Cleans, sanitizes, and normalizes URLs from browser tabs, web captures,
 * and user input into a canonical structure suitable for deduplication,
 * tracking, and domain extraction.
 *
 * Pure function — zero side effects, zero external dependencies.
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface NormalizedUrlResult {
  /** The original input string provided to the normalizer. */
  readonly originalUrl: string;
  /** Canonical normalized URL, or empty string if input was invalid. */
  readonly normalizedUrl: string;
  /** Second-level + top-level domain without subdomains (e.g. 'mangadex.org'). */
  readonly domain: string;
  /** Last non-empty path segment cleaned of extensions and URL encoding. */
  readonly cleanSlug: string;
  /** Backward-compatible alias for cleanSlug. */
  readonly slug: string;
  /** Whether the input was parsed as a valid HTTP/HTTPS URL. */
  readonly isValid: boolean;
  /** Protocol scheme (e.g. 'https', 'http') in lowercase without trailing colon. */
  readonly scheme: string;
  /** Normalized hostname in lowercase (e.g. 'mangadex.org', 'www.webtoons.com'). */
  readonly hostname: string;
  /** Normalized pathname (with leading slash, trailing slash stripped unless root). */
  readonly path: string;
  /** List of stripped tracking / analytical query parameter names. */
  readonly strippedParams: readonly string[];
}

// ---------------------------------------------------------------------------
// Tracking Parameters to Strip
// ---------------------------------------------------------------------------

const TRACKING_PARAM_PREFIXES = ["utm_", "ga_", "fb_", "_gl", "_ga"];

const TRACKING_PARAMS = new Set([
  // Marketing & analytics
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_reader",
  "gclid",
  "gclsrc",
  "dclid",
  "yclid",
  "fbclid",
  "fbc",
  "fbp",
  "twclid",
  "igshid",
  "ttclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "_hsenc",
  "_hsmi",
  "vero_id",
  "wickedid",
  // Referrals & tracking affiliates
  "ref",
  "source",
  "referrer",
  "affiliate_id",
  "aff_id",
  "aff",
  "affiliate",
  // Social & share metadata
  "share_id",
  "si",
  "spm",
  "feature",
  // Session identifiers and cache-busting query keys.
  "session_id",
  "jsessionid",
  "phpsessid",
  "_",
  "v",
  "t",
  "timestamp",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract root domain from hostname (e.g. 'reader.mangadex.org' -> 'mangadex.org').
 */
function extractRootDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split(".");
  if (parts.length <= 2) {
    return hostname.toLowerCase();
  }
  // Check for common ccTLD patterns like .co.uk, .com.br, .org.uk
  const secondLast = parts[parts.length - 2];
  if (
    parts.length >= 3 &&
    secondLast &&
    (secondLast === "co" || secondLast === "com" || secondLast === "org" || secondLast === "net") &&
    parts[parts.length - 1] &&
    parts[parts.length - 1]!.length === 2
  ) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

/**
 * Extract clean slug from pathname.
 * E.g. '/title/abc-123/frieren-beyond-journeys-end/' -> 'frieren-beyond-journeys-end'
 * E.g. '/manga/solo-leveling.html' -> 'solo-leveling'
 */
function extractCleanSlug(pathname: string): string {
  const segments = pathname
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (segments.length === 0) {
    return "";
  }

  const rawLast = segments[segments.length - 1] ?? "";
  let decoded = rawLast;
  try {
    decoded = decodeURIComponent(rawLast);
  } catch {
    // Keep rawLast if decode fails
  }

  // Strip common file extensions
  return decoded.replace(/\.(html?|php|aspx?|jsp)$/i, "");
}

// ---------------------------------------------------------------------------
// Main Pure Function
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw URL string:
 * - Validates standard http/https schemes
 * - Lowercases scheme and hostname
 * - Strips default ports (80 for http, 443 for https)
 * - Removes URL fragment/hash (#...)
 * - Strips all tracking and marketing query parameters (UTMs, fbclid, ref, etc.)
 * - Sorts remaining query parameters for deterministic deduplication
 * - Removes trailing slashes (e.g. `/path/` -> `/path`, `https://example.com/` -> `https://example.com`)
 * - Extracts root domain and clean slug
 *
 * @param rawUrl The input URL string.
 * @returns { normalizedUrl: string; domain: string; cleanSlug: string } & NormalizedUrlResult
 */
export function normalizeUrl(rawUrl: string): NormalizedUrlResult {
  const trimmed = rawUrl.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      originalUrl: rawUrl,
      normalizedUrl: "",
      domain: "",
      cleanSlug: "",
      slug: "",
      isValid: false,
      scheme: "",
      hostname: "",
      path: "",
      strippedParams: [],
    };
  }

  // Only http and https URLs are accepted for normalization
  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return {
      originalUrl: rawUrl,
      normalizedUrl: "",
      domain: "",
      cleanSlug: "",
      slug: "",
      isValid: false,
      scheme: protocol.replace(/:$/, ""),
      hostname: url.hostname || "",
      path: url.pathname || "",
      strippedParams: [],
    };
  }

  const scheme = protocol.slice(0, -1);
  const hostname = url.hostname.toLowerCase();
  const domain = extractRootDomain(hostname);

  // Strip fragment (#)
  url.hash = "";

  // Strip default ports
  if (
    (protocol === "https:" && url.port === "443") ||
    (protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }

  // Strip tracking and marketing query parameters
  const strippedParams: string[] = [];
  const searchParams = new URLSearchParams(url.search);
  const keysToRemove: string[] = [];

  for (const [key] of searchParams.entries()) {
    const lowerKey = key.toLowerCase();
    const isTracking =
      TRACKING_PARAMS.has(lowerKey) ||
      TRACKING_PARAM_PREFIXES.some((prefix) => lowerKey.startsWith(prefix));

    if (isTracking) {
      keysToRemove.push(key);
      strippedParams.push(key);
    }
  }

  for (const key of keysToRemove) {
    searchParams.delete(key);
  }

  // Sort remaining query parameters for deterministic canonicalization
  searchParams.sort();

  // Normalize pathname: remove trailing slash
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const cleanSlug = extractCleanSlug(pathname);

  // Remove trailing slash even for root path when building canonical URL
  let pathPart = pathname;
  if (pathPart === "/") {
    pathPart = "";
  }

  // Assemble canonical URL
  const queryStr = searchParams.toString();
  const searchPart = queryStr.length > 0 ? `?${queryStr}` : "";
  const portPart = url.port ? `:${url.port}` : "";
  const canonicalUrl = `${protocol}//${hostname}${portPart}${pathPart}${searchPart}`;

  return {
    originalUrl: rawUrl,
    normalizedUrl: canonicalUrl,
    domain,
    cleanSlug,
    slug: cleanSlug,
    isValid: true,
    scheme,
    hostname,
    path: pathname,
    strippedParams,
  };
}
