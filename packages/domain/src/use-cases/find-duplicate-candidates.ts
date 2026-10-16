/**
 * Duplicate Candidate Detection Engine
 *
 * Implements pure domain logic for detecting potential duplicate Works in Chronicles Vault.
 *
 * Detects candidates using:
 * - Normalized titles (case/punctuation insensitive, subtitle stripping, lemmata, diacritics, roman numerals)
 * - Alternative titles
 * - Aliases
 * - External identifiers (AniList ID, MAL ID, MangaDex, etc.)
 *
 * Returns candidate pairs with confidence scores and detailed match reasons.
 */

import { Work } from '../entities/work.js';
import { ExternalIdentifier } from '../value-objects/external-identifier.js';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface DuplicateCandidatePair {
  readonly workA: Work;
  readonly workB: Work;
  readonly confidence: number; // 0.0 to 1.0
  readonly matchReasons: readonly string[];
}

export interface FindDuplicateOptions {
  /** Minimum confidence threshold for candidates (0.0 to 1.0, default: 0.4). */
  readonly minConfidence?: number;
  /** Maximum number of candidate pairs to return. */
  readonly limit?: number;
  /** If true, includes archived / soft-deleted works in scan. Default: false. */
  readonly includeArchived?: boolean;
}

export interface WorkComparisonResult {
  readonly confidence: number;
  readonly matchReasons: readonly string[];
  readonly isDuplicate: boolean;
}

// ---------------------------------------------------------------------------
// Title Normalization & Lemmatization Helpers
// ---------------------------------------------------------------------------

const ROMAN_NUMERALS: Record<string, string> = {
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
  x: '10',
};

/**
 * Strips subtitle delimiters, parenthetical tags, and season/volume suffixes
 * to isolate the base title of a work.
 */
export function stripSubtitles(title: string): string {
  let cleaned = title.trim();

  // 1. Remove bracketed / parenthetical formats: (Manga), [Official], (TV), (Webtoon), etc.
  cleaned = cleaned.replace(/\s*(\(|\[)(manga|webtoon|anime|tv|light novel|novel|comic|manhwa|manhua|official|dub|sub|color|uncensored|serial|adaptation)[^()\]]*(\)|\])/gi, ' ');
  cleaned = cleaned.replace(/\s*(\(|\[)(season|part|cour|vol\.?)\s*\d+[^()\]]*(\)|\])/gi, ' ');

  // 2. Strip after subtitle delimiters: " : ", " - ", " ~ ", " | ", " — ", " – "
  const delimiterMatch = cleaned.match(/\s+[:\-~|—–]\s+(.+)$/);
  if (delimiterMatch && delimiterMatch.index && delimiterMatch.index > 2) {
    cleaned = cleaned.slice(0, delimiterMatch.index);
  } else if (cleaned.includes(': ')) {
    const colonIdx = cleaned.indexOf(': ');
    if (colonIdx > 2) {
      cleaned = cleaned.slice(0, colonIdx);
    }
  }

  // 3. Remove trailing season / volume suffixes: "Season 2", "2nd Season", "Part 2", "Vol. 1"
  cleaned = cleaned.replace(/\s+(season\s*\d+|\d+(st|nd|rd|th)\s*season|part\s*\d+|cour\s*\d+|vol(ume)?\.?\s*\d+)$/gi, '');

  return cleaned.trim();
}

/**
 * Normalizes title for deduplication:
 * - Lowercases and removes accents/diacritics
 * - Normalizes '&' to 'and'
 * - Converts small Roman numerals to digits
 * - Removes leading articles ('the', 'a', 'an')
 * - Strips punctuation and collapses whitespace
 * - Applies simple English inflection / stemming lemmata (e.g. possessive 's, common plural s)
 */
export function normalizeTitleForDeduplication(title: string): string {
  if (!title) return '';

  // 1. Unicode NFD diacritics removal and lowercase
  let norm = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // 2. Replace '&' with 'and'
  norm = norm.replace(/\s*&\s*/g, ' and ');

  // 3. Strip possessive 's
  norm = norm.replace(/['’]s\b/g, '');

  // 4. Remove punctuation
  norm = norm.replace(/[^a-z0-9\s]/g, ' ');

  // 5. Tokenize
  const rawTokens = norm.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return '';

  // 6. Strip grammatical articles ('the', 'a', 'an')
  const nonArticles = rawTokens.filter((t) => t !== 'the' && t !== 'a' && t !== 'an');
  const tokensToUse = nonArticles.length > 0 ? nonArticles : rawTokens;

  // 7. Token-level lemmatization (roman numerals and simple trailing plural 's')
  const lemmatized = tokensToUse.map((token) => {
    if (ROMAN_NUMERALS[token]) {
      return ROMAN_NUMERALS[token];
    }
    // Simple lemma: strip trailing plural 's' for words > 3 characters (e.g., 'chronicles' -> 'chronicle')
    if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss') && !token.endsWith('us') && !token.endsWith('is')) {
      return token.slice(0, -1);
    }
    return token;
  });

  return lemmatized.join(' ').trim();
}

/**
 * Levenshtein distance similarity (0.0 to 1.0).
 */
function titleLevenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const m = a.length;
  const n = b.length;
  const maxLen = Math.max(m, n);
  if (maxLen === 0) return 1.0;

  const dp = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const current = Math.min(dp[j]! + 1, prev + 1, dp[j - 1]! + cost);
      dp[j - 1] = prev;
      prev = current;
    }
    dp[n] = prev;
  }
  return Math.max(0, 1.0 - dp[n]! / maxLen);
}

// ---------------------------------------------------------------------------
// Core Pair Comparison Logic
// ---------------------------------------------------------------------------

function normalizeProviderName(provider: string): string {
  const p = provider.trim().toLowerCase();
  if (p === 'myanimelist' || p === 'my_anime_list') return 'mal';
  return p;
}

/**
 * Compare two works and determine similarity confidence and match reasons.
 */
export function compareWorksForDuplicates(
  workA: Work,
  workB: Work,
  threshold: number = 0.4,
): WorkComparisonResult {
  const reasons: string[] = [];
  let bestConfidence = 0.0;

  // 1. External Identifier Match (AniList, MAL, MangaDex, etc.)
  for (const extA of workA.externalIds) {
    const provA = normalizeProviderName(extA.provider);
    const idA = extA.externalId.trim().toLowerCase();
    for (const extB of workB.externalIds) {
      const provB = normalizeProviderName(extB.provider);
      const idB = extB.externalId.trim().toLowerCase();
      if (provA === provB && idA === idB) {
        bestConfidence = 1.0;
        reasons.push(`Shared External ID: ${extA.provider.toLowerCase().trim()}:${extA.externalId.trim()}`);
      }
    }
  }

  // 2. Exact Title Match (Case-insensitive raw or trimmed)
  const rawTitleA = workA.title.trim();
  const rawTitleB = workB.title.trim();
  if (rawTitleA.toLowerCase() === rawTitleB.toLowerCase()) {
    bestConfidence = Math.max(bestConfidence, 1.0);
    reasons.push('Exact Title Match');
  }

  // 3. Normalized Title Match
  const normTitleA = normalizeTitleForDeduplication(rawTitleA);
  const normTitleB = normalizeTitleForDeduplication(rawTitleB);

  if (normTitleA && normTitleB) {
    if (normTitleA === normTitleB) {
      bestConfidence = Math.max(bestConfidence, 0.95);
      if (!reasons.includes('Exact Title Match')) {
        reasons.push('Normalized Title Match');
      }
    } else {
      // Check subtitle-stripped base title
      const baseA = normalizeTitleForDeduplication(stripSubtitles(rawTitleA));
      const baseB = normalizeTitleForDeduplication(stripSubtitles(rawTitleB));
      if (baseA && baseB && baseA === baseB && baseA.length >= 3) {
        bestConfidence = Math.max(bestConfidence, 0.90);
        if (!reasons.includes('Normalized Title Match') && !reasons.includes('Exact Title Match')) {
          reasons.push('Normalized Title Match');
        }
      }
    }
  }

  // 4. Alternative Titles Match
  const altTitlesA = workA.alternativeTitles.map((t) => t.trim());
  const altTitlesB = workB.alternativeTitles.map((t) => t.trim());

  let hasAltMatch = false;
  // Check workA's title or altTitles against workB's altTitles
  const titlesA = [rawTitleA, ...altTitlesA];
  const titlesB = [rawTitleB, ...altTitlesB];

  for (const tA of titlesA) {
    const normA = normalizeTitleForDeduplication(tA);
    if (!normA) continue;
    for (const tB of titlesB) {
      // Don't re-check primary vs primary since already checked above
      if (tA === rawTitleA && tB === rawTitleB) continue;
      const normB = normalizeTitleForDeduplication(tB);
      if (normA === normB) {
        hasAltMatch = true;
        bestConfidence = Math.max(bestConfidence, 0.90);
        break;
      }
    }
    if (hasAltMatch) break;
  }

  if (hasAltMatch && !reasons.includes('Alternative Title Match')) {
    reasons.push('Alternative Title Match');
  }

  // 5. Alias Match
  const aliasesA = workA.aliases.map((a) => a.trim().toLowerCase());
  const aliasesB = workB.aliases.map((a) => a.trim().toLowerCase());
  let hasAliasMatch = false;

  for (const aliasA of aliasesA) {
    if (!aliasA) continue;
    if (aliasesB.includes(aliasA)) {
      hasAliasMatch = true;
      break;
    }
    // Also check if an alias equals the primary title of the other
    if (aliasA === rawTitleB.toLowerCase() || aliasA === normTitleB) {
      hasAliasMatch = true;
      break;
    }
  }

  if (!hasAliasMatch) {
    for (const aliasB of aliasesB) {
      if (!aliasB) continue;
      if (aliasB === rawTitleA.toLowerCase() || aliasB === normTitleA) {
        hasAliasMatch = true;
        break;
      }
    }
  }

  if (hasAliasMatch) {
    bestConfidence = Math.max(bestConfidence, 0.88);
    if (!reasons.includes('Alias Match')) {
      reasons.push('Alias Match');
    }
  }

  // 6. Fuzzy string similarity if no strong match yet
  if (bestConfidence < 0.8 && normTitleA && normTitleB) {
    const sim = titleLevenshteinSimilarity(normTitleA, normTitleB);
    if (sim >= 0.82) {
      bestConfidence = Math.max(bestConfidence, Math.round(sim * 100) / 100);
      reasons.push('High Title Similarity');
    }
  }

  const roundedScore = Math.round(bestConfidence * 100) / 100;
  return {
    confidence: roundedScore,
    matchReasons: reasons,
    isDuplicate: roundedScore >= threshold && reasons.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Main Use Case Function: findDuplicateCandidates
// ---------------------------------------------------------------------------

/**
 * Find duplicate candidate pairs across an entire collection of works,
 * or against a single target work.
 *
 * @param worksOrTarget Array of works to scan, OR a single target Work.
 * @param poolOrOptions Candidate pool (if first param is Work) or options.
 * @param maybeOptions Options if first param is Work.
 */
export function findDuplicateCandidates(
  works: readonly Work[],
  options?: FindDuplicateOptions,
): readonly DuplicateCandidatePair[];
export function findDuplicateCandidates(
  targetWork: Work,
  pool: readonly Work[],
  options?: FindDuplicateOptions,
): readonly DuplicateCandidatePair[];
export function findDuplicateCandidates(
  worksOrTarget: readonly Work[] | Work,
  poolOrOptions?: readonly Work[] | FindDuplicateOptions,
  maybeOptions?: FindDuplicateOptions,
): readonly DuplicateCandidatePair[] {
  // Disambiguate arguments
  if (Array.isArray(worksOrTarget)) {
    const works = worksOrTarget as readonly Work[];
    const options = (poolOrOptions as FindDuplicateOptions | undefined) ?? {};
    return findDuplicatesInList(works, options);
  } else {
    const target = worksOrTarget as Work;
    const pool = (poolOrOptions as readonly Work[] | undefined) ?? [];
    const options = maybeOptions ?? {};
    return findDuplicatesForTarget(target, pool, options);
  }
}

function findDuplicatesInList(
  works: readonly Work[],
  options: FindDuplicateOptions,
): readonly DuplicateCandidatePair[] {
  const minConfidence = options.minConfidence ?? 0.4;
  const includeArchived = options.includeArchived ?? false;

  const eligible = works.filter((w) => {
    if (includeArchived) return true;
    return w.deletedAt === null && !w.mergedIntoWorkId;
  });

  const candidates: DuplicateCandidatePair[] = [];

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const workA = eligible[i]!;
      const workB = eligible[j]!;

      // Skip identical IDs
      if (workA.id === workB.id) continue;

      const result = compareWorksForDuplicates(workA, workB, minConfidence);
      if (result.isDuplicate) {
        candidates.push({
          workA,
          workB,
          confidence: result.confidence,
          matchReasons: result.matchReasons,
        });
      }
    }
  }

  // Sort descending by confidence, then ascending by title
  candidates.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.workA.title.localeCompare(b.workA.title);
  });

  if (options.limit && options.limit > 0) {
    return candidates.slice(0, options.limit);
  }
  return candidates;
}

function findDuplicatesForTarget(
  target: Work,
  pool: readonly Work[],
  options: FindDuplicateOptions,
): readonly DuplicateCandidatePair[] {
  const minConfidence = options.minConfidence ?? 0.4;
  const includeArchived = options.includeArchived ?? false;

  const candidates: DuplicateCandidatePair[] = [];

  for (const candidateWork of pool) {
    if (candidateWork.id === target.id) continue;
    if (!includeArchived && (candidateWork.deletedAt !== null || candidateWork.mergedIntoWorkId)) {
      continue;
    }

    const result = compareWorksForDuplicates(target, candidateWork, minConfidence);
    if (result.isDuplicate) {
      candidates.push({
        workA: target,
        workB: candidateWork,
        confidence: result.confidence,
        matchReasons: result.matchReasons,
      });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  if (options.limit && options.limit > 0) {
    return candidates.slice(0, options.limit);
  }
  return candidates;
}
