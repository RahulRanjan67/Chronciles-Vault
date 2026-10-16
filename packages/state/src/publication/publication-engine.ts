/**
 * Cycle 11 publication engine.
 *
 * Pure functions only. A list can be exported as a publication only when the
 * pre-publication privacy scrubber finds zero leaks. Blocking is enforced here
 * (the document is never built when any finding exists), not only in the UI.
 *
 * Checks, applied to every text field that would appear in the output:
 *  - the list itself must be Public;
 *  - every entry must reference an existing, non-private work;
 *  - no private tags, inline private markers, or vault references;
 *  - no run of eight words copied from a private memory or vault note
 *    (short private notes are matched whole);
 *  - the vault must be unlocked when it holds data, so private text can be
 *    compared at all. A locked vault blocks publication.
 *
 * Covers are included only when they are https URLs. Anything else is dropped
 * rather than published, so local file paths and blob URLs never leave the app.
 */

import { PrivacyState } from "@chronicles-vault/domain";

export type PublicationFindingKind =
  | "list_not_public"
  | "work_missing"
  | "work_private"
  | "private_tag"
  | "private_marker"
  | "vault_reference"
  | "private_text_match"
  | "reread_attempt_leak"
  | "vault_unverified";

export interface PublicationFinding {
  readonly kind: PublicationFindingKind;
  /** Entry the finding belongs to, or null for list-level findings. */
  readonly entryId: string | null;
  /** Human-readable location, such as "personal note" or "description". */
  readonly field: string;
  readonly message: string;
}

export interface PublicationWork {
  readonly id: string;
  readonly title: string;
  readonly author: string | null;
  readonly contentType: string;
  readonly genres: readonly string[];
  readonly tags: readonly string[];
  readonly synopsis: string | null;
  readonly privacyState: string;
  readonly coverRef: string | null;
  readonly totalChapters: string | null;
  readonly rating: number | null;
}

export interface PublicationListItem {
  readonly id: string;
  readonly workId: string;
  readonly position: number;
  readonly personalNote: string | null;
  readonly readingAttemptId?: string | null;
}

export interface PublicationList {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly privacyState: string;
  readonly items: readonly PublicationListItem[];
}

/** Text that must never appear in a publication: private memory bodies and unlocked vault notes. */
export interface PrivateTextSource {
  readonly label: string;
  readonly text: string;
  readonly readingAttemptId?: string | null;
}

export type VaultVerificationStatus = "unlocked" | "locked" | "uninitialized";

export interface PublicationInput {
  readonly list: PublicationList;
  readonly works: readonly PublicationWork[];
  readonly excludedEntryIds?: readonly string[];
  readonly privateSources: readonly PrivateTextSource[];
  readonly vaultStatus: VaultVerificationStatus;
  readonly generatedAt: string;
}

export interface PublicationEntry {
  readonly entryId: string;
  readonly position: number;
  readonly title: string;
  readonly author: string | null;
  readonly contentType: string;
  readonly genres: readonly string[];
  readonly synopsis: string | null;
  readonly personalNote: string | null;
  readonly rating: number | null;
  readonly totalChapters: string | null;
  readonly coverUrl: string | null;
}

export interface PublicationDocument {
  readonly title: string;
  readonly description: string | null;
  readonly generatedAt: string;
  readonly entries: readonly PublicationEntry[];
}

export type PublicationEvaluation =
  | { readonly status: "ready"; readonly document: PublicationDocument; readonly findings: readonly [] }
  | { readonly status: "blocked"; readonly document: null; readonly findings: readonly PublicationFinding[] };

const SHINGLE_WORDS = 8;
const MIN_WHOLE_NEEDLE_LENGTH = 12;
const PRIVATE_TAG_NAMES = new Set(["private", "vault", "secret", "confidential", "hidden", "personal"]);
const PRIVATE_TAG_PREFIXES = ["private:", "vault:", "secret:", "_private:"];
const MARKER_PATTERN = /\[(private|vault)\]|\[\/(private|vault)\]|\|\|(private|vault):/i;
const VAULT_REFERENCE_PATTERN = /\bprivate vault\b|\bvault:[\w-]+|vault:\/\//i;

export function normalizeForScan(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPrivateTagName(tag: string): boolean {
  const clean = tag.trim().replace(/^#/, "").toLowerCase();
  if (PRIVATE_TAG_NAMES.has(clean)) return true;
  return PRIVATE_TAG_PREFIXES.some((prefix) => clean.startsWith(prefix));
}

/** Eight-word shingles from private text. Short private text is kept whole. */
export function privateNeedles(text: string): string[] {
  const normalized = normalizeForScan(text);
  if (!normalized) return [];
  const words = normalized.split(" ");
  if (words.length < SHINGLE_WORDS) {
    return normalized.length >= MIN_WHOLE_NEEDLE_LENGTH ? [normalized] : [];
  }
  const needles: string[] = [];
  for (let i = 0; i + SHINGLE_WORDS <= words.length; i++) {
    needles.push(words.slice(i, i + SHINGLE_WORDS).join(" "));
  }
  return needles;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  webtoon: "Webtoon",
  light_novel: "Light novel",
  web_novel: "Web novel",
  western_novel: "Novel",
  anime: "Anime",
  donghua: "Donghua",
  epub: "EPUB",
  pdf: "PDF",
  cbz: "CBZ",
};

/** Readable label for a content type enum value. Unknown values are title-cased. */
export function contentTypeLabel(value: string): string {
  if (!value) return "Work";
  const known = CONTENT_TYPE_LABELS[value];
  if (known) return known;
  const spaced = value.replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function safeHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

interface ScanContext {
  readonly needles: readonly string[];
  readonly rereadNeedles: readonly string[];
  readonly findings: PublicationFinding[];
}

function scanText(
  ctx: ScanContext,
  text: string | null,
  entryId: string | null,
  field: string,
): void {
  if (!text) return;

  if (MARKER_PATTERN.test(text)) {
    ctx.findings.push({
      kind: "private_marker",
      entryId,
      field,
      message: `${field} contains an inline private marker.`,
    });
  }
  if (VAULT_REFERENCE_PATTERN.test(text)) {
    ctx.findings.push({
      kind: "vault_reference",
      entryId,
      field,
      message: `${field} refers to the Private Vault.`,
    });
  }

  const normalized = normalizeForScan(text);
  if (normalized && ctx.needles.some((needle) => normalized.includes(needle))) {
    ctx.findings.push({
      kind: "private_text_match",
      entryId,
      field,
      message: `${field} repeats text from a private memory or vault note.`,
    });
  }
  if (normalized && ctx.rereadNeedles.some((needle) => normalized.includes(needle))) {
    ctx.findings.push({
      kind: "reread_attempt_leak",
      entryId,
      field,
      message: `${field} repeats text or attempt identifier from a private reread memory.`,
    });
  }
}

function scanTags(
  ctx: ScanContext,
  tags: readonly string[],
  entryId: string | null,
  field: string,
): void {
  if (tags.some(isPrivateTagName)) {
    ctx.findings.push({
      kind: "private_tag",
      entryId,
      field,
      message: `${field} includes a private tag.`,
    });
  }
}

/**
 * Evaluate a list for publication. Returns `ready` with a document only when
 * there are zero findings. Otherwise returns `blocked` with every finding.
 */
export function evaluatePublication(input: PublicationInput): PublicationEvaluation {
  const { list, works, privateSources, vaultStatus, generatedAt } = input;
  const excluded = new Set(input.excludedEntryIds ?? []);
  const worksById = new Map(works.map((work) => [work.id, work]));

  const needles = privateSources.flatMap((source) => privateNeedles(source.text));
  const rereadNeedles = privateSources
    .filter((source) => Boolean(source.readingAttemptId))
    .flatMap((source) => [
      ...privateNeedles(source.text),
      ...(source.readingAttemptId ? [normalizeForScan(source.readingAttemptId)] : []),
    ])
    .filter(Boolean);
  const ctx: ScanContext = {
    needles: [...new Set(needles)],
    rereadNeedles: [...new Set(rereadNeedles)],
    findings: [],
  };

  if (list.privacyState !== PrivacyState.Public) {
    ctx.findings.push({
      kind: "list_not_public",
      entryId: null,
      field: "list",
      message: "The list is not public. Set it to Public before publishing.",
    });
  }

  if (vaultStatus === "locked") {
    ctx.findings.push({
      kind: "vault_unverified",
      entryId: null,
      field: "vault",
      message: "Unlock the Private Vault so every private note can be checked before publishing.",
    });
  }

  scanText(ctx, list.title, null, "list title");
  scanText(ctx, list.description, null, "list description");

  const orderedItems = [...list.items].sort((a, b) => a.position - b.position);
  const entries: PublicationEntry[] = [];

  for (const item of orderedItems) {
    if (excluded.has(item.id)) continue;

    const work = worksById.get(item.workId);
    if (!work) {
      ctx.findings.push({
        kind: "work_missing",
        entryId: item.id,
        field: "work",
        message: "This entry refers to a work that no longer exists.",
      });
      continue;
    }

    if (work.privacyState === PrivacyState.Private || work.privacyState === PrivacyState.Vault) {
      ctx.findings.push({
        kind: "work_private",
        entryId: item.id,
        field: "work",
        message: "This work is private or in the vault. Exclude it from the publication.",
      });
    }

    if (item.readingAttemptId) {
      ctx.findings.push({
        kind: "reread_attempt_leak",
        entryId: item.id,
        field: "personal note",
        message: "This note is tied to an earlier reread pass and must be cleared or excluded before publishing.",
      });
    }

    scanTags(ctx, work.tags, item.id, "work tags");
    scanTags(ctx, work.genres, item.id, "work genres");
    scanText(ctx, work.title, item.id, "work title");
    scanText(ctx, work.author, item.id, "author");
    scanText(ctx, work.synopsis, item.id, "synopsis");
    scanText(ctx, item.personalNote, item.id, "personal note");

    entries.push({
      entryId: item.id,
      position: entries.length,
      title: work.title,
      author: work.author,
      contentType: contentTypeLabel(work.contentType),
      genres: [...work.genres],
      synopsis: work.synopsis,
      personalNote: item.personalNote,
      rating: work.rating,
      totalChapters: work.totalChapters,
      coverUrl: safeHttpsUrl(work.coverRef),
    });
  }

  if (ctx.findings.length > 0) {
    return { status: "blocked", document: null, findings: ctx.findings };
  }

  return {
    status: "ready",
    findings: [],
    document: {
      title: list.title,
      description: list.description,
      generatedAt,
      entries,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderers. Every interpolated value is escaped.
// ─────────────────────────────────────────────────────────────────────────────

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+\-.!|<>])/g, "\\$1");
}

function formatRating(rating: number | null): string | null {
  return rating === null ? null : `${rating.toFixed(1)} / 10`;
}

function formatRatingScaleMarkdown(rating: number | null): string | null {
  if (rating === null) return null;
  const clamped = Math.max(0, Math.min(10, rating));
  const filled = Math.round(clamped);
  const bar = "■".repeat(filled) + "□".repeat(10 - filled);
  return `[${bar}] ${clamped.toFixed(1)}/10`;
}

export function renderPublicationMarkdown(doc: PublicationDocument): string {
  const lines: string[] = [];
  lines.push(`# ${escapeMarkdown(doc.title)}`);
  lines.push("");
  lines.push(`\`CURATED EDITION · ${doc.entries.length} WORKS · ${escapeMarkdown(doc.generatedAt)}\``);
  lines.push("");
  if (doc.description) {
    lines.push(`> ${escapeMarkdown(doc.description)}`);
    lines.push("");
  }
  doc.entries.forEach((entry, index) => {
    const idxLabel = String(index + 1).padStart(2, "0");
    const meta = [entry.author, entry.contentType, entry.totalChapters, formatRatingScaleMarkdown(entry.rating)]
      .filter((part): part is string => Boolean(part))
      .map(escapeMarkdown)
      .join(" · ");
    lines.push(`${index + 1}. \`[${idxLabel}]\` **${escapeMarkdown(entry.title)}**${meta ? ` — ${meta}` : ""}`);
    if (entry.genres.length > 0) {
      lines.push(`   Genres: ${entry.genres.map(escapeMarkdown).join(" / ")}`);
    }
    if (entry.synopsis) {
      lines.push(`   ${escapeMarkdown(entry.synopsis)}`);
    }
    if (entry.personalNote) {
      lines.push(`   _${escapeMarkdown(entry.personalNote)}_`);
    }
    lines.push("");
  });
  lines.push(`_Generated ${escapeMarkdown(doc.generatedAt)} · Chronicles Vault_`);
  return lines.join("\n") + "\n";
}

const EDITORIAL_CSS = `
:root {
  color-scheme: light dark;
  --ink: #0f0e13;
  --muted: #5b5768;
  --subtle: #8b8698;
  --rule: #e2dfe8;
  --surface: #f2f0f7;
  --accent: #ec4899;
  --accent-telemetry: #7c3aed;
  --paper: #faf9fc;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ink: #f6f4fa;
    --muted: #a69fb8;
    --subtle: #6e6782;
    --rule: #252031;
    --surface: #14111d;
    --accent: #f472b6;
    --accent-telemetry: #d2ff00;
    --paper: #09080d;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font: 16px/1.65 "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
main {
  max-width: 56rem;
  margin: 0 auto;
  padding: 3.5rem 1.5rem 6rem;
}
header {
  border-top: 2px solid var(--ink);
  border-bottom: 1px solid var(--rule);
  padding: 2rem 0 2.25rem;
  margin-bottom: 2.5rem;
  position: relative;
}
.eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font: 600 0.72rem/1 "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 1rem;
}
h1 {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.05;
  margin: 0 0 0.85rem;
  letter-spacing: -0.03em;
}
.standfirst {
  color: var(--muted);
  font-size: 1.125rem;
  line-height: 1.55;
  max-width: 42rem;
  margin: 0;
}
ol {
  list-style: none;
  counter-reset: entry;
  padding: 0;
  margin: 0;
}
li {
  counter-increment: entry;
  display: grid;
  grid-template-columns: 4.5rem 1fr auto;
  gap: 1.5rem;
  align-items: start;
  padding: 2rem 0;
  border-bottom: 1px solid var(--rule);
}
@media (max-width: 640px) {
  li { grid-template-columns: 3rem 1fr; }
  .cover { grid-column: 2; }
}
.index-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.15rem;
}
.index-num {
  font: 800 1.65rem/1 "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: -0.04em;
  color: var(--ink);
}
.index-bar {
  width: 2rem;
  height: 3px;
  background: var(--accent);
}
.body-col { min-width: 0; }
.title {
  font-size: 1.45rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin: 0 0 0.35rem;
}
.meta {
  font: 500 0.8rem/1.4 "JetBrains Mono", ui-monospace, monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 0.75rem;
}
.scale {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font: 600 0.75rem/1 "JetBrains Mono", ui-monospace, monospace;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  margin: 0 0 0.85rem;
}
.scale-bar {
  width: 7rem;
  height: 0.4rem;
  border-radius: 2px;
  background: var(--rule);
  overflow: hidden;
}
.scale-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-telemetry));
}
.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 0.8rem;
}
.genre-pill {
  font: 500 0.72rem/1 "JetBrains Mono", ui-monospace, monospace;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
}
.synopsis {
  color: var(--muted);
  font-size: 0.95rem;
  margin: 0 0 0.75rem;
}
.note {
  border-left: 3px solid var(--accent);
  background: var(--surface);
  padding: 0.65rem 0.95rem;
  border-radius: 0 6px 6px 0;
  font-size: 0.95rem;
  margin: 0.5rem 0 0;
}
.cover {
  width: 5.5rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--rule);
}
footer {
  margin-top: 3rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  font: 500 0.75rem/1.4 "JetBrains Mono", ui-monospace, monospace;
  color: var(--subtle);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
`;

export function renderPublicationHtml(doc: PublicationDocument): string {
  const items = doc.entries
    .map((entry, idx) => {
      const idxLabel = String(idx + 1).padStart(2, "0");
      const meta = [entry.author, entry.contentType, entry.totalChapters]
        .filter((part): part is string => Boolean(part))
        .map(escapeHtml)
        .join(" · ");
      const scale =
        entry.rating === null
          ? ""
          : `<div class="scale"><span class="scale-bar"><span class="scale-fill" style="width:${Math.max(
              0,
              Math.min(100, entry.rating * 10),
            ).toFixed(0)}%"></span></span><span>${escapeHtml(formatRating(entry.rating) ?? "")}</span></div>`;
      const cover = entry.coverUrl
        ? `<img class="cover" src="${escapeHtml(entry.coverUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
        : "";
      const genres =
        entry.genres.length > 0
          ? `<div class="genres">${entry.genres.map((g) => `<span class="genre-pill">${escapeHtml(g)}</span>`).join("")}</div>`
          : "";
      const synopsis = entry.synopsis ? `<p class="synopsis">${escapeHtml(entry.synopsis)}</p>` : "";
      const note = entry.personalNote ? `<blockquote class="note">${escapeHtml(entry.personalNote)}</blockquote>` : "";
      return `<li><div class="index-col"><span class="index-num">${idxLabel}</span><span class="index-bar"></span></div><div class="body-col"><h2 class="title">${escapeHtml(entry.title)}</h2><p class="meta">${meta}</p>${scale}${genres}${synopsis}${note}</div>${cover}</li>`;
    })
    .join("\n");

  const description = doc.description ? `<p class="standfirst">${escapeHtml(doc.description)}</p>` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https:">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(doc.title)}</title>
<style>${EDITORIAL_CSS}</style>
</head>
<body>
<main>
<header>
<p class="eyebrow"><span>Chronicles Vault // Curated Index</span><span>${doc.entries.length} Works</span></p>
<h1>${escapeHtml(doc.title)}</h1>
${description}
</header>
<ol>
${items}
</ol>
<footer><span>Generated ${escapeHtml(doc.generatedAt)}</span><span>Chronicles Vault</span></footer>
</main>
</body>
</html>
`;
}
