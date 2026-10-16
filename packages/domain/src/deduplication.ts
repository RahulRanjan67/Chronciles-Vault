/**
 * Deduplication Engine
 *
 * Detects duplicate works and matches captured browser tabs to existing Works.
 * Uses URL normalization, title similarity, and provider-specific identifiers
 * to calculate confidence scores for duplicate detection.
 *
 * Pure functions — zero side effects, zero external dependencies.
 */

import { Capture } from './entities/capture.js';
import { Work } from './entities/work.js';
import { normalizeUrl, type NormalizedUrlResult } from './use-cases/url-normalizer.js';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

/**
 * Confidence level for a duplicate match.
 */
export enum DuplicateConfidence {
  Exact = 'exact',
  High = 'high',
  Probable = 'probable',
  Low = 'low',
  None = 'none',
}

/**
 * A suggested duplicate match with confidence scoring.
 */
export interface DuplicateSuggestion {
  /** The existing Work ID that might be a duplicate. */
  readonly workId: string;
  /** The title of the suggested duplicate work. */
  readonly workTitle: string;
  /** Confidence score from 0.0 to 1.0. */
  readonly score: number;
  /** Confidence tier for the match. */
  readonly confidence: DuplicateConfidence;
  /** Human-readable reasons for the match. */
  readonly reasons: readonly string[];
}

/**
 * Result of a duplicate detection check.
 */
export interface DuplicateDetectionResult {
  /** The capture being evaluated. */
  readonly captureId: string;
  /** Best matching work, if any. */
  readonly bestMatch: DuplicateSuggestion | null;
  /** All candidate matches ranked by score. */
  readonly candidates: readonly DuplicateSuggestion[];
  /** Whether a duplicate was detected with sufficient confidence. */
  readonly isDuplicate: boolean;
}

// ---------------------------------------------------------------------------
// String Similarity Helpers
// ---------------------------------------------------------------------------

/**
 * Clean and normalize a title for comparison.
 */
function cleanTitle(raw: string): string {
  // Remove non-alphanumeric characters, lowercase
  let cleaned = raw.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1]! : Math.min(row[j - 1]!, row[j]!, prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length]!;
}

/**
 * Compute normalized Levenshtein similarity (0.0 to 1.0).
 */
function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1.0 - dist / maxLen);
}

/**
 * Compute Token Jaccard similarity (0.0 to 1.0).
 */
function tokenJaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 1));
  const tokensB = new Set(b.split(/\s+/).filter((t) => t.length > 1));

  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0.0 : intersection / union;
}

// ---------------------------------------------------------------------------
// URL Similarity
// ---------------------------------------------------------------------------

/**
 * Calculate similarity between two URLs based on normalized forms.
 *
 * @param url1 First URL string
 * @param url2 Second URL string
 * @returns Similarity score from 0.0 to 1.0
 */
export function calculateUrlSimilarity(url1: string, url2: string): number {
  const norm1 = normalizeUrl(url1);
  const norm2 = normalizeUrl(url2);

  // If either URL is invalid, no similarity
  if (!norm1.isValid || !norm2.isValid) {
    return 0.0;
  }

  // Exact match on normalized URLs
  if (norm1.normalizedUrl === norm2.normalizedUrl) {
    return 1.0;
  }

  // Check domain match
  if (norm1.domain !== norm2.domain) {
    return 0.0;
  }

  // Check slug similarity
  const slug1 = cleanTitle(norm1.cleanSlug);
  const slug2 = cleanTitle(norm2.cleanSlug);

  if (slug1 === slug2) {
    return 0.95; // Same slug, different query params or fragment
  }

  // Levenshtein similarity on slugs
  const slugSim = levenshteinSimilarity(slug1, slug2);
  if (slugSim >= 0.8) {
    return slugSim * 0.9; // Weight slug similarity at 90%
  }

  // Path similarity (compare path segments)
  const path1 = norm1.path.split('/').filter((p) => p);
  const path2 = norm2.path.split('/').filter((p) => p);

  if (path1.length === 0 && path2.length === 0) {
    return 0.7; // Both are root URLs on same domain
  }

  if (path1.length > 0 && path2.length > 0 && path1[0] === path2[0]) {
    return 0.6; // Same first path segment (e.g., same manga ID)
  }

  return 0.0;
}

// ---------------------------------------------------------------------------
// Title Similarity
// ---------------------------------------------------------------------------

/**
 * Calculate similarity between two titles.
 *
 * @param title1 First title
 * @param title2 Second title
 * @returns Similarity score from 0.0 to 1.0
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const cleaned1 = cleanTitle(title1);
  const cleaned2 = cleanTitle(title2);

  if (!cleaned1 || !cleaned2) {
    return 0.0;
  }

  // Exact match
  if (cleaned1 === cleaned2) {
    return 1.0;
  }

  // Substring match (one contains the other)
  if (
    (cleaned1.length >= 4 && cleaned2.includes(cleaned1)) ||
    (cleaned2.length >= 4 && cleaned1.includes(cleaned2))
  ) {
    return 0.85;
  }

  // Levenshtein similarity
  const levSim = levenshteinSimilarity(cleaned1, cleaned2);
  if (levSim >= 0.75) {
    return levSim;
  }

  // Token Jaccard similarity
  const jaccardSim = tokenJaccardSimilarity(cleaned1, cleaned2);
  if (jaccardSim >= 0.6) {
    return jaccardSim;
  }

  return 0.0;
}

// ---------------------------------------------------------------------------
// Provider-Specific Matching
// ---------------------------------------------------------------------------

/**
 * Check if two URLs likely refer to the same work on a provider-specific basis.
 *
 * @param norm1 Normalized URL result for first URL
 * @param norm2 Normalized URL result for second URL
 * @returns Match score from 0.0 to 1.0, or null if not applicable
 */
function providerSpecificMatch(norm1: NormalizedUrlResult, norm2: NormalizedUrlResult): number | null {
  // MangaDex: URL pattern /title/{id}/{slug}
  if (norm1.domain === 'mangadex.org' && norm2.domain === 'mangadex.org') {
    const id1 = norm1.path.split('/')[1];
    const id2 = norm2.path.split('/')[1];
    if (id1 && id2 && id1 === id2) {
      return 1.0; // Same MangaDex title ID
    }
  }

  // Webtoons: URL pattern /title/{slug}
  if (norm1.domain === 'webtoons.com' && norm2.domain === 'webtoons.com') {
    const parts1 = norm1.path.split('/');
    const parts2 = norm2.path.split('/');
    // Pattern: /en/title/{slug} or /title/{slug}
    const slug1 = parts1[parts1.length - 1];
    const slug2 = parts2[parts2.length - 1];
    if (slug1 && slug2 && slug1 === slug2) {
      return 0.95;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main Duplicate Detection
// ---------------------------------------------------------------------------

/**
 * Detect if a capture matches any existing works in the vault.
 *
 * Evaluates:
 * - URL similarity (normalized URLs, domain, slug)
 * - Title similarity (primary title, alternative titles, aliases)
 * - Provider-specific identifier matching
 *
 * @param capture The capture to evaluate
 * @param existingWorks Array of existing works in the vault
 * @returns DuplicateDetectionResult with ranked candidates
 */
export function detectDuplicate(
  capture: Capture,
  existingWorks: readonly Work[],
): DuplicateDetectionResult {
  const captureUrl = capture.url?.trim() ?? '';
  const captureTitle = capture.title?.trim() ?? '';

  // Early exit if no data to compare
  if (!captureUrl && !captureTitle) {
    return {
      captureId: capture.id,
      bestMatch: null,
      candidates: [],
      isDuplicate: false,
    };
  }

  const normCaptureUrl = captureUrl ? normalizeUrl(captureUrl) : null;
  const cleanedCaptureTitle = captureTitle ? cleanTitle(captureTitle) : '';
  const captureSlug = normCaptureUrl?.slug ? cleanTitle(normCaptureUrl.slug) : '';

  const candidates: DuplicateSuggestion[] = [];

  for (const work of existingWorks) {
    const reasons: string[] = [];
    let bestScore = 0.0;

    // 1. Check URL similarity if capture has a URL
    if (normCaptureUrl && normCaptureUrl.isValid) {
      // Check work's access paths for URLs
      for (const extId of work.externalIds) {
        if (extId.url) {
          const urlSim = calculateUrlSimilarity(captureUrl, extId.url);
          if (urlSim > bestScore) {
            bestScore = urlSim;
            if (urlSim >= 0.95) {
              reasons.push(`URL match with ${extId.provider} reference`);
            } else if (urlSim >= 0.8) {
              reasons.push(`Strong URL similarity with ${extId.provider} reference`);
            }
          }
        }
      }

      // Provider-specific matching on capture URL vs external IDs
      if (normCaptureUrl.isValid) {
        for (const extId of work.externalIds) {
          if (extId.url) {
            const normExtUrl = normalizeUrl(extId.url);
            if (normExtUrl.isValid) {
              const providerMatch = providerSpecificMatch(normCaptureUrl, normExtUrl);
              if (providerMatch !== null && providerMatch > bestScore) {
                bestScore = providerMatch;
                reasons.push(`Provider-specific match with ${extId.provider}`);
              }
            }
          }
        }
      }
    }

    // 2. Check title similarity
    const titlesToCheck: { title: string; type: string }[] = [
      { title: work.title, type: 'primary' },
      ...work.alternativeTitles.map((t) => ({ title: t, type: 'alternative' })),
      ...work.aliases.map((a) => ({ title: a, type: 'alias' })),
    ];

    for (const item of titlesToCheck) {
      const cleanedTarget = cleanTitle(item.title);
      if (!cleanedTarget) continue;

      const titleSim = calculateTitleSimilarity(captureTitle, item.title);
      if (titleSim > bestScore) {
        bestScore = titleSim;
        if (titleSim >= 0.95) {
          reasons.push(`Exact title match with ${item.type} title "${item.title}"`);
        } else if (titleSim >= 0.8) {
          reasons.push(`High title similarity with ${item.type} title "${item.title}"`);
        } else if (titleSim >= 0.6) {
          reasons.push(`Moderate title similarity with ${item.type} title "${item.title}"`);
        }
      }

      // Check slug against title
      if (captureSlug) {
        const slugTitleSim = calculateTitleSimilarity(captureSlug, item.title);
        if (slugTitleSim >= 0.8 && slugTitleSim * 0.9 > bestScore) {
          bestScore = slugTitleSim * 0.9;
          reasons.push(`URL slug matches ${item.type} title "${item.title}"`);
        }
      }
    }

    // 3. Check external ID provider matching (e.g., same MangaDex ID in URL)
    if (normCaptureUrl && normCaptureUrl.isValid) {
      for (const extId of work.externalIds) {
        // Check if the capture URL contains the external ID
        if (normCaptureUrl.path.includes(extId.externalId) || normCaptureUrl.path.includes(extId.externalId.replace(/-/g, '_'))) {
          const idMatchScore = 0.9;
          if (idMatchScore > bestScore) {
            bestScore = idMatchScore;
            reasons.push(`URL contains ${extId.provider} ID "${extId.externalId}"`);
          }
        }
      }
    }

    // Only include candidates with meaningful scores
    if (bestScore >= 0.3) {
      let confidence: DuplicateConfidence;
      if (bestScore >= 0.95) confidence = DuplicateConfidence.Exact;
      else if (bestScore >= 0.8) confidence = DuplicateConfidence.High;
      else if (bestScore >= 0.5) confidence = DuplicateConfidence.Probable;
      else confidence = DuplicateConfidence.Low;

      candidates.push({
        workId: work.id,
        workTitle: work.title,
        score: Math.round(bestScore * 100) / 100,
        confidence,
        reasons,
      });
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const bestMatch = candidates[0] ?? null;
  const isDuplicate = bestMatch !== null && bestMatch.confidence !== DuplicateConfidence.Low && bestMatch.confidence !== DuplicateConfidence.None;

  return {
    captureId: capture.id,
    bestMatch,
    candidates,
    isDuplicate,
  };
}

/**
 * Quick check if two works are likely duplicates based on their data.
 *
 * @param work1 First work
 * @param work2 Second work
 * @returns Similarity score from 0.0 to 1.0
 */
export function calculateWorkSimilarity(work1: Work, work2: Work): number {
  // Check external ID matches
  for (const extId1 of work1.externalIds) {
    for (const extId2 of work2.externalIds) {
      if (extId1.provider === extId2.provider && extId1.externalId === extId2.externalId) {
        return 1.0; // Same external ID = same work
      }
    }
  }

  // Check title similarity
  const titleSim = calculateTitleSimilarity(work1.title, work2.title);
  if (titleSim >= 0.95) {
    return titleSim;
  }

  // Check alternative titles and aliases
  let bestAltSim = 0.0;
  for (const alt1 of [...work1.alternativeTitles, ...work1.aliases]) {
    for (const alt2 of [...work2.alternativeTitles, ...work2.aliases]) {
      const sim = calculateTitleSimilarity(alt1, alt2);
      if (sim > bestAltSim) {
        bestAltSim = sim;
      }
    }
  }

  return Math.max(titleSim, bestAltSim);
}
