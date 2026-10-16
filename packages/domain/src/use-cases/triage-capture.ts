import { CaptureId, WorkId } from '@chronicles-vault/shared';
import { Capture } from '../entities/capture.js';
import { Work } from '../entities/work.js';
import { normalizeUrl } from './url-normalizer.js';

// ---------------------------------------------------------------------------
// Enums & Types
// ---------------------------------------------------------------------------

/**
 * Confidence tier for a triage match candidate.
 */
export enum TriageConfidence {
  Exact = 'exact',
  High = 'high',
  Probable = 'probable',
  Low = 'low',
  None = 'none',
}

/**
 * Recommended automated or default action for the triage queue.
 */
export enum TriageRecommendation {
  AttachToExisting = 'attach_to_existing',
  CreateNew = 'create_new',
  Discard = 'discard',
}

/**
 * Candidate match for a captured item against an existing Work in the Vault.
 */
export interface MatchCandidate {
  readonly workId: WorkId;
  readonly workTitle: string;
  readonly score: number; // 0.0 to 1.0
  readonly confidence: TriageConfidence;
  readonly matchReasons: readonly string[];
}

/**
 * Comprehensive triage evaluation result for a captured item.
 */
export interface TriageMatchResult {
  readonly captureId: CaptureId;
  readonly bestMatch: MatchCandidate | null;
  readonly candidates: readonly MatchCandidate[];
  readonly recommendation: TriageRecommendation;
  readonly confidence: TriageConfidence;
  readonly explanation: string;
}

/**
 * Alias for TriageMatchResult.
 */
export type TriageResult = TriageMatchResult;

// ---------------------------------------------------------------------------
// Junk Patterns to Discard
// ---------------------------------------------------------------------------

const JUNK_TITLE_PATTERNS = [
  /^404\b/i,
  /^not found\b/i,
  /^page not found\b/i,
  /^access denied\b/i,
  /^forbidden\b/i,
  /^cloudflare\b/i,
  /^just a moment\b/i,
  /^attention required\b/i,
  /^new tab$/i,
  /^untitled$/i,
  /^about:blank$/i,
  /^loading\.\.\.$/i,
];

// Common web reader noise suffixes (e.g. "Chapter 42 - MangaDex", "Read Free Online - Asura Scans")
const NOISE_SUFFIX_REGEX =
  /\s*[-–—|:]\s*(chapter|ep|episode|vol|volume|read|manga|manhwa|scans|dex|reader|online|free|raw|hd).*$/i;

// ---------------------------------------------------------------------------
// String Distance & Similarity Metrics
// ---------------------------------------------------------------------------

/**
 * Clean and tokenize a title for robust matching.
 */
function cleanTitle(raw: string): string {
  // Strip common chapter/reader suffixes
  let cleaned = raw.replace(NOISE_SUFFIX_REGEX, '');
  // Remove non-alphanumeric characters, lowercase
  cleaned = cleaned.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
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
// Pure Function Triage Engine
// ---------------------------------------------------------------------------

/**
 * Evaluates a captured link or browser tab against existing Works in the Vault.
 *
 * Computes:
 * - Title similarity (Levenshtein + Token Jaccard across title, aliases, alternativeTitles)
 * - URL and slug cross-matching
 * - Discard heuristics for junk/error tabs
 * - Confidence scoring and actionable recommendations
 *
 * @param capture The capture entity to evaluate.
 * @param existingWorks Collection of works in the user's library.
 * @returns TriageMatchResult with ranked candidates and recommendation.
 */
export function triageCaptureItem(
  capture: Capture,
  existingWorks: readonly Work[],
): TriageResult {
  const title = capture.title?.trim() ?? '';
  const url = capture.url?.trim() ?? '';

  // 1. Check for junk/error pages to discard
  const isJunkTitle = JUNK_TITLE_PATTERNS.some((pattern) => pattern.test(title));
  if (isJunkTitle || (!title && !url)) {
    return {
      captureId: capture.id,
      bestMatch: null,
      candidates: [],
      recommendation: TriageRecommendation.Discard,
      confidence: TriageConfidence.High,
      explanation: isJunkTitle
        ? `Page title "${title}" matches a known error, 404, or blank tab pattern`
        : 'Captured item contains neither a title nor a URL',
    };
  }

  const normalizedCaptureUrl = url ? normalizeUrl(url) : null;
  const cleanedCaptureTitle = cleanTitle(title);
  const captureSlug = normalizedCaptureUrl?.slug ? cleanTitle(normalizedCaptureUrl.slug) : '';

  const candidates: MatchCandidate[] = [];

  for (const work of existingWorks) {
    const reasons: string[] = [];
    let bestScore = 0.0;

    // Check titles to compare against
    const titlesToCheck: { title: string; type: 'primary' | 'alternative' | 'alias' }[] = [
      { title: work.title, type: 'primary' },
      ...work.alternativeTitles.map((t) => ({ title: t, type: 'alternative' as const })),
      ...work.aliases.map((a) => ({ title: a, type: 'alias' as const })),
    ];

    for (const item of titlesToCheck) {
      const cleanedTarget = cleanTitle(item.title);
      if (!cleanedTarget) continue;

      // Exact match
      if (cleanedCaptureTitle === cleanedTarget) {
        bestScore = Math.max(bestScore, 1.0);
        reasons.push(`Exact match with ${item.type} title "${item.title}"`);
        break;
      }

      // Substring match
      if (
        (cleanedCaptureTitle.length >= 4 && cleanedTarget.includes(cleanedCaptureTitle)) ||
        (cleanedTarget.length >= 4 && cleanedCaptureTitle.includes(cleanedTarget))
      ) {
        const subScore = 0.85;
        if (subScore > bestScore) {
          bestScore = subScore;
          reasons.push(`Substring match with ${item.type} title "${item.title}"`);
        }
      }

      // Levenshtein similarity
      const lev = levenshteinSimilarity(cleanedCaptureTitle, cleanedTarget);
      if (lev >= 0.75 && lev > bestScore) {
        bestScore = lev;
        reasons.push(
          `High character similarity (${Math.round(lev * 100)}%) with ${item.type} title "${item.title}"`,
        );
      }

      // Token Jaccard similarity
      const jaccard = tokenJaccardSimilarity(cleanedCaptureTitle, cleanedTarget);
      if (jaccard >= 0.6 && jaccard > bestScore) {
        bestScore = Math.max(bestScore, jaccard);
        reasons.push(
          `Token overlap (${Math.round(jaccard * 100)}%) with ${item.type} title "${item.title}"`,
        );
      }

      // Check slug against work title
      if (captureSlug) {
        const slugLev = levenshteinSimilarity(captureSlug, cleanedTarget);
        if (slugLev >= 0.8 && slugLev * 0.9 > bestScore) {
          bestScore = slugLev * 0.9;
          reasons.push(`URL slug "${captureSlug}" matched ${item.type} title "${item.title}"`);
        }
      }
    }

    if (bestScore >= 0.2) {
      let confidence: TriageConfidence;
      if (bestScore >= 0.95) confidence = TriageConfidence.Exact;
      else if (bestScore >= 0.8) confidence = TriageConfidence.High;
      else if (bestScore >= 0.5) confidence = TriageConfidence.Probable;
      else confidence = TriageConfidence.Low;

      candidates.push({
        workId: work.id,
        workTitle: work.title,
        score: Math.round(bestScore * 100) / 100,
        confidence,
        matchReasons: reasons,
      });
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const bestMatch = candidates[0] ?? null;

  if (bestMatch && (bestMatch.confidence === TriageConfidence.Exact || bestMatch.confidence === TriageConfidence.High)) {
    return {
      captureId: capture.id,
      bestMatch,
      candidates,
      recommendation: TriageRecommendation.AttachToExisting,
      confidence: bestMatch.confidence,
      explanation: `Strong match with existing work "${bestMatch.workTitle}" (${bestMatch.matchReasons[0] ?? 'similarity score ' + bestMatch.score})`,
    };
  }

  if (bestMatch && bestMatch.confidence === TriageConfidence.Probable) {
    return {
      captureId: capture.id,
      bestMatch,
      candidates,
      recommendation: TriageRecommendation.AttachToExisting,
      confidence: TriageConfidence.Probable,
      explanation: `Probable match with "${bestMatch.workTitle}" (${bestMatch.matchReasons[0] ?? 'partial match'}), user verification advised`,
    };
  }

  return {
    captureId: capture.id,
    bestMatch: null,
    candidates,
    recommendation: TriageRecommendation.CreateNew,
    confidence: candidates.length > 0 ? TriageConfidence.Low : TriageConfidence.None,
    explanation:
      candidates.length > 0
        ? `No strong match found (closest was "${candidates[0]?.workTitle}" at ${candidates[0]?.score}). Recommend creating a new work.`
        : 'No similar works found in your Vault. Recommend adding as a new work.',
  };
}
