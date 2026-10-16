/**
 * Global search engine for Cycle 10 (Ctrl+K command palette).
 *
 * Pure and framework-free so it can be unit tested. The browser client has no
 * SQLite runtime, so this uses an in-memory case-insensitive token index over
 * the already-loaded repository data. It does not implement FTS5.
 *
 * Privacy rules enforced here, not in the UI:
 *  - Vault works and vault-classified memories are never returned.
 *  - Vault notes are searched only when `vaultUnlocked` is true; otherwise they
 *    are ignored even if the caller passes them.
 *  - Major-spoiler memories are excluded entirely, so their existence cannot be
 *    probed by typing.
 *  - Minor-spoiler memories match on title and tags only, and their snippet is
 *    hidden. Mild and spoiler-free memories match on body text too.
 *  - Source results expose only the host of a URL, never its path or query.
 */

import { MemoryType, PrivacyState, SpoilerLevel } from "@chronicles-vault/domain";

export type SearchCategory = "works" | "memories" | "lore" | "sources" | "files" | "vault";

export const SEARCH_CATEGORY_LABELS: Record<SearchCategory, string> = {
  works: "Works",
  memories: "Memories",
  lore: "Lore",
  sources: "Sources",
  files: "Local files",
  vault: "Private Vault",
};

/** Display order for grouped results. */
export const SEARCH_CATEGORY_ORDER: readonly SearchCategory[] = [
  "works",
  "memories",
  "lore",
  "sources",
  "files",
  "vault",
];

export interface SearchableWork {
  readonly id: string;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly genres: readonly string[];
  readonly tags: readonly string[];
  readonly description: string | null;
  readonly privacyState: string;
  readonly deletedAt?: string | null;
  readonly mergedIntoWorkId?: string | null;
  readonly updatedAt: string;
  readonly accessPaths: readonly SearchableAccessPath[];
}

export interface SearchableAccessPath {
  readonly id: string;
  readonly kind: string;
  readonly label: string | null;
  /** Full URL is accepted for convenience, but only its host is ever returned. */
  readonly url?: string | null;
}

export interface SearchableMemory {
  readonly id: string;
  readonly workId: string | null;
  readonly type: string;
  readonly title: string | null;
  readonly body: string | null;
  readonly tags: readonly string[];
  readonly spoilerLevel: string;
  readonly privacyState: string;
  readonly readingAttemptId?: string | null;
  readonly updatedAt: string;
}

export interface SearchableFile {
  readonly id: string;
  readonly displayName: string;
  readonly format: string;
  readonly workId: string | null;
}

export interface SearchableVaultNote {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

export interface GlobalSearchInput {
  readonly query: string;
  readonly works: readonly SearchableWork[];
  readonly memories: readonly SearchableMemory[];
  readonly files: readonly SearchableFile[];
  /** Ignored unless `vaultUnlocked` is true. */
  readonly vaultNotes?: readonly SearchableVaultNote[];
  readonly vaultUnlocked: boolean;
  /** Max results per category (default 8). */
  readonly limitPerCategory?: number;
}

export interface GlobalSearchResult {
  readonly key: string;
  readonly category: SearchCategory;
  readonly title: string;
  readonly subtitle: string | null;
  /** Null when the snippet is hidden (spoiler-protected) or not applicable. */
  readonly snippet: string | null;
  readonly route: string;
  readonly score: number;
}

export interface GlobalSearchGroup {
  readonly category: SearchCategory;
  readonly label: string;
  readonly results: readonly GlobalSearchResult[];
}

const MAX_TOKENS = 8;
const MAX_TOKEN_LENGTH = 64;
const SNIPPET_RADIUS_BEFORE = 40;
const SNIPPET_LENGTH = 120;

/** Split a raw query into lowercase tokens. Empty query → []. */
export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim().slice(0, MAX_TOKEN_LENGTH))
    .filter((token) => token.length > 0)
    .slice(0, MAX_TOKENS);
}

interface FieldMatch {
  readonly score: number;
}

/**
 * Score a set of weighted fields against all query tokens (AND semantics).
 * Returns null when any token is missing from every field.
 */
function scoreFields(
  tokens: readonly string[],
  fields: ReadonlyArray<{ text: string | null | undefined; weight: number }>,
): FieldMatch | null {
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      if (!field.text) continue;
      if (field.text.toLowerCase().includes(token) && field.weight > best) {
        best = field.weight;
      }
    }
    if (best === 0) return null;
    total += best;
  }
  return { score: total };
}

/** Returns a short window around the first token match, or null if none. */
export function makeSnippet(text: string | null | undefined, tokens: readonly string[]): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  let index = -1;
  for (const token of tokens) {
    const found = lower.indexOf(token);
    if (found !== -1 && (index === -1 || found < index)) index = found;
  }
  const start = Math.max(0, index === -1 ? 0 : index - SNIPPET_RADIUS_BEFORE);
  const slice = text.slice(start, start + SNIPPET_LENGTH).replace(/\s+/g, " ").trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = start + SNIPPET_LENGTH < text.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}

/** Host-only label for a URL; returns null for invalid or non-HTTP(S) URLs. */
export function safeHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.host;
  } catch {
    return null;
  }
}

function sortAndLimit(
  results: GlobalSearchResult[],
  limit: number,
): GlobalSearchResult[] {
  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export function runGlobalSearch(input: GlobalSearchInput): GlobalSearchGroup[] {
  const tokens = tokenizeQuery(input.query);
  if (tokens.length === 0) return [];
  const limit = input.limitPerCategory ?? 8;

  const byCategory: Record<SearchCategory, GlobalSearchResult[]> = {
    works: [],
    memories: [],
    lore: [],
    sources: [],
    files: [],
    vault: [],
  };

  const workTitles = new Map<string, string>();
  for (const work of input.works) {
    workTitles.set(work.id, work.title);
  }

  // ── Works ────────────────────────────────────────────────────────────────
  for (const work of input.works) {
    if (work.privacyState === PrivacyState.Vault) continue;
    if (work.deletedAt || work.mergedIntoWorkId) continue;

    const match = scoreFields(tokens, [
      { text: work.title, weight: 3 },
      { text: work.aliases.join(" "), weight: 2 },
      { text: work.genres.join(" "), weight: 1 },
      { text: work.tags.join(" "), weight: 1 },
      { text: work.description, weight: 1 },
    ]);
    if (match) {
      byCategory.works.push({
        key: `works:${work.id}`,
        category: "works",
        title: work.title,
        subtitle: work.genres.length > 0 ? work.genres.slice(0, 3).join(" · ") : null,
        snippet: null,
        route: `/work/${encodeURIComponent(work.id)}`,
        score: match.score,
      });
    }

    // ── Sources: each access path is searched on its own, so a query such as
    // a site name finds the source even when the parent work title does not match.
    for (const path of work.accessPaths) {
      const host = safeHost(path.url ?? null);
      const label = path.label ?? host ?? path.kind;
      const pathMatch = scoreFields(tokens, [
        { text: label, weight: 2 },
        { text: host, weight: 1 },
      ]);
      if (!pathMatch) continue;
      byCategory.sources.push({
        key: `sources:${path.id}`,
        category: "sources",
        title: label,
        subtitle: work.title,
        snippet: host,
        route: `/work/${encodeURIComponent(work.id)}`,
        score: pathMatch.score,
      });
    }
  }

  // ── Memories and lore ────────────────────────────────────────────────────
  for (const memory of input.memories) {
    if (memory.privacyState === PrivacyState.Vault) continue;
    if (memory.spoilerLevel === SpoilerLevel.Major) continue;

    const isLore = memory.type === MemoryType.LoreEntry;
    const hideBody = memory.spoilerLevel === SpoilerLevel.Minor;
    const match = scoreFields(tokens, [
      { text: memory.title, weight: 3 },
      { text: memory.tags.join(" "), weight: 2 },
      { text: memory.readingAttemptId, weight: 1 },
      { text: hideBody ? null : memory.body, weight: 1 },
    ]);
    if (!match) continue;

    const workTitle = memory.workId ? workTitles.get(memory.workId) ?? null : null;
    const subtitleParts = [
      workTitle,
      memory.readingAttemptId ? `Pass ${memory.readingAttemptId}` : null,
    ].filter((part): part is string => Boolean(part));
    const snippet = hideBody ? null : makeSnippet(memory.body, tokens);
    const route = memory.workId ? `/work/${encodeURIComponent(memory.workId)}` : "/memory";
    byCategory[isLore ? "lore" : "memories"].push({
      key: `${isLore ? "lore" : "memories"}:${memory.id}`,
      category: isLore ? "lore" : "memories",
      title: memory.title?.trim() || (isLore ? "Lore entry" : "Untitled memory"),
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : null,
      snippet: hideBody ? "Spoiler-protected. Reveal it in Memory to read." : snippet,
      route,
      score: match.score,
    });
  }

  // ── Local files ──────────────────────────────────────────────────────────
  for (const file of input.files) {
    const workTitle = file.workId ? workTitles.get(file.workId) ?? null : null;
    const match = scoreFields(tokens, [
      { text: file.displayName, weight: 3 },
      { text: file.format, weight: 1 },
    ]);
    if (!match) continue;
    byCategory.files.push({
      key: `files:${file.id}`,
      category: "files",
      title: file.displayName,
      subtitle: workTitle ?? "Unmatched file",
      snippet: null,
      route: `/reader/${encodeURIComponent(file.id)}`,
      score: match.score,
    });
  }

  // ── Private Vault notes: only when unlocked ─────────────────────────────
  if (input.vaultUnlocked && input.vaultNotes) {
    for (const note of input.vaultNotes) {
      const match = scoreFields(tokens, [
        { text: note.title, weight: 3 },
        { text: note.body, weight: 1 },
      ]);
      if (!match) continue;
      byCategory.vault.push({
        key: `vault:${note.id}`,
        category: "vault",
        title: note.title || "Untitled note",
        subtitle: null,
        snippet: makeSnippet(note.body, tokens),
        route: "/vault",
        score: match.score,
      });
    }
  }

  const groups: GlobalSearchGroup[] = [];
  for (const category of SEARCH_CATEGORY_ORDER) {
    const results = sortAndLimit(byCategory[category], limit);
    if (results.length > 0) {
      groups.push({ category, label: SEARCH_CATEGORY_LABELS[category], results });
    }
  }
  return groups;
}
