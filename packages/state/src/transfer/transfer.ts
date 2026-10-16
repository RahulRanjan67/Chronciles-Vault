/**
 * Cycle 12 export and import engine. Pure functions only: the caller maps
 * repository data into the plain shapes below and writes files with the result.
 *
 * Privacy defaults:
 *  - Vault records are excluded from every export unless the caller passes the
 *    exact confirmation phrase VAULT_EXPORT_CONFIRMATION.
 *  - Spreadsheet cells that start with formula characters are prefixed with an
 *    apostrophe so they cannot run as formulas when opened.
 *  - Only http and https URLs are accepted from imported files.
 */

export const BACKUP_FORMAT = "chronicles-vault-backup";
export const BACKUP_VERSION = 1;
export const VAULT_EXPORT_CONFIRMATION = "INCLUDE VAULT";
export const MAX_IMPORT_CHARACTERS = 25_000_000;
export const MAX_IMPORT_ROWS = 10_000;

export interface BackupAccessPath {
  readonly id: string;
  readonly kind: string;
  readonly label: string | null;
  readonly url: string | null;
  readonly isPreferred: boolean;
}

export interface BackupWork {
  readonly id: string;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly description: string | null;
  readonly contentType: string;
  readonly origin: string;
  readonly publicationState: string;
  readonly privacyState: string;
  readonly coverRef: string | null;
  readonly genres: readonly string[];
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly accessPaths: readonly BackupAccessPath[];
}

export interface BackupMemory {
  readonly id: string;
  readonly workId: string;
  readonly type: string;
  readonly title: string | null;
  readonly body: string | null;
  readonly spoilerLevel: string;
  readonly privacyState: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
}

export interface BackupListItem {
  readonly id: string;
  readonly workId: string;
  readonly position: number;
  readonly personalNote: string | null;
}

export interface BackupList {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly privacyState: string;
  readonly items: readonly BackupListItem[];
}

export interface BackupRelation {
  readonly id: string;
  readonly sourceWorkId: string;
  readonly targetWorkId: string;
  readonly relationType: string;
}

export interface BackupVaultNote {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

export interface BackupSnapshot {
  readonly format: typeof BACKUP_FORMAT;
  readonly version: typeof BACKUP_VERSION;
  readonly exportedAt: string;
  readonly includesVault: boolean;
  readonly works: readonly BackupWork[];
  readonly memories: readonly BackupMemory[];
  readonly lists: readonly BackupList[];
  readonly relations: readonly BackupRelation[];
  readonly vaultNotes?: readonly BackupVaultNote[];
}

export interface BackupSource {
  readonly works: readonly BackupWork[];
  readonly memories: readonly BackupMemory[];
  readonly lists: readonly BackupList[];
  readonly relations: readonly BackupRelation[];
  /** Only read when vault export is explicitly confirmed. */
  readonly vaultNotes?: readonly BackupVaultNote[];
}

export interface BuildBackupOptions {
  readonly exportedAt: string;
  readonly includeVault?: boolean;
  readonly vaultConfirmation?: string;
}

export function buildBackup(source: BackupSource, options: BuildBackupOptions): BackupSnapshot {
  const includeVault = options.includeVault === true;
  if (includeVault && options.vaultConfirmation !== VAULT_EXPORT_CONFIRMATION) {
    throw new Error(`Vault export requires typing ${VAULT_EXPORT_CONFIRMATION} to confirm.`);
  }

  const works = source.works.filter((work) => work.privacyState !== "vault");
  const workIds = new Set(works.map((work) => work.id));
  const memories = source.memories.filter(
    (memory) => memory.privacyState !== "vault" && workIds.has(memory.workId),
  );
  const relations = source.relations.filter(
    (relation) => workIds.has(relation.sourceWorkId) && workIds.has(relation.targetWorkId),
  );
  const lists = source.lists.filter((list) => list.privacyState !== "vault");

  const snapshot: BackupSnapshot = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: options.exportedAt,
    includesVault: includeVault,
    works,
    memories,
    lists,
    relations,
  };

  if (includeVault) {
    return { ...snapshot, vaultNotes: [...(source.vaultNotes ?? [])] };
  }
  return snapshot;
}

export function serializeBackup(snapshot: BackupSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export type ParseResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly errors: readonly string[] };

const WORK_PRIVACY = new Set(["public", "private"]);
const MEMORY_PRIVACY = new Set(["public", "private"]);

export function parseBackup(text: string): ParseResult<BackupSnapshot> {
  const errors: string[] = [];
  if (text.length > MAX_IMPORT_CHARACTERS) {
    return { ok: false, errors: ["File is larger than the 25 MB import limit."] };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["File is not valid JSON."] };
  }
  if (!isRecord(raw)) return { ok: false, errors: ["Backup root must be an object."] };
  if (raw["format"] !== BACKUP_FORMAT) errors.push("File is not a Chronicles Vault backup.");
  if (raw["version"] !== BACKUP_VERSION) errors.push(`Unsupported backup version: ${String(raw["version"])}.`);
  if (typeof raw["exportedAt"] !== "string") errors.push("exportedAt is missing.");
  if (raw["includesVault"] === true) errors.push("Backups that include the vault are not accepted for import.");

  const works = asArray(raw["works"], "works", errors);
  const memories = asArray(raw["memories"], "memories", errors);
  const lists = asArray(raw["lists"], "lists", errors);
  const relations = asArray(raw["relations"], "relations", errors);

  const workIds = new Set<string>();
  for (const [index, work] of works.entries()) {
    if (!isRecord(work)) {
      errors.push(`works[${index}] is not an object.`);
      continue;
    }
    const id = requireString(work["id"], `works[${index}].id`, errors);
    if (id) {
      if (workIds.has(id)) errors.push(`Duplicate work id: ${id}.`);
      workIds.add(id);
    }
    requireString(work["title"], `works[${index}].title`, errors, 500);
    if (typeof work["privacyState"] !== "string" || !WORK_PRIVACY.has(work["privacyState"])) {
      errors.push(`works[${index}].privacyState must be public or private.`);
    }
    if (Array.isArray(work["accessPaths"])) {
      for (const [pathIndex, path] of work["accessPaths"].entries()) {
        if (isRecord(path) && typeof path["url"] === "string" && safeHttpUrl(path["url"]) === null) {
          errors.push(`works[${index}].accessPaths[${pathIndex}] has a non-http URL.`);
        }
      }
    }
  }

  for (const [index, memory] of memories.entries()) {
    if (!isRecord(memory)) {
      errors.push(`memories[${index}] is not an object.`);
      continue;
    }
    requireString(memory["id"], `memories[${index}].id`, errors);
    if (typeof memory["workId"] !== "string" || !workIds.has(memory["workId"])) {
      errors.push(`memories[${index}] refers to a work that is not in this backup.`);
    }
    if (typeof memory["privacyState"] !== "string" || !MEMORY_PRIVACY.has(memory["privacyState"])) {
      errors.push(`memories[${index}].privacyState must be public or private.`);
    }
  }

  for (const [index, relation] of relations.entries()) {
    if (!isRecord(relation)) continue;
    if (typeof relation["sourceWorkId"] !== "string" || !workIds.has(relation["sourceWorkId"])) {
      errors.push(`relations[${index}] source is not in this backup.`);
    }
    if (typeof relation["targetWorkId"] !== "string" || !workIds.has(relation["targetWorkId"])) {
      errors.push(`relations[${index}] target is not in this backup.`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: raw as unknown as BackupSnapshot };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV
// ─────────────────────────────────────────────────────────────────────────────

export const WORKS_CSV_HEADER = [
  "id",
  "title",
  "content_type",
  "genres",
  "tags",
  "privacy_state",
  "publication_state",
  "description",
  "access_url",
] as const;

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string): string {
  const guarded = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded) || guarded.startsWith(" ") || guarded.endsWith(" ")
    ? `"${guarded.replace(/"/g, '""')}"`
    : guarded;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n") + "\r\n";
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (inQuotes) throw new Error("CSV has an unterminated quoted field.");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((candidate) => !(candidate.length === 1 && candidate[0] === ""));
}

function unguardCell(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}

export function worksToCsv(works: readonly BackupWork[]): string {
  const rows: string[][] = [[...WORKS_CSV_HEADER]];
  for (const work of works) {
    rows.push([
      work.id,
      work.title,
      work.contentType,
      work.genres.join("|"),
      work.tags.join("|"),
      work.privacyState,
      work.publicationState,
      work.description ?? "",
      work.accessPaths.find((path) => path.isPreferred)?.url ?? work.accessPaths.find((path) => path.url)?.url ?? "",
    ]);
  }
  return toCsv(rows);
}

export interface CandidateWork {
  readonly title: string;
  readonly contentType: string | null;
  readonly genres: readonly string[];
  readonly tags: readonly string[];
  readonly privacyState: "public" | "private";
  readonly description: string | null;
  readonly accessUrl: string | null;
  readonly sourceLine: number;
}

export interface CandidateParseResult {
  readonly candidates: CandidateWork[];
  readonly invalid: { readonly line: number; readonly reason: string }[];
}

export function parseWorksCsv(text: string): CandidateParseResult {
  if (text.length > MAX_IMPORT_CHARACTERS) {
    return { candidates: [], invalid: [{ line: 0, reason: "File is larger than the 25 MB import limit." }] };
  }
  const rows = parseCsv(text);
  const [header, ...body] = rows;
  if (!header) return { candidates: [], invalid: [{ line: 0, reason: "File is empty." }] };
  const column = (name: string) => header.findIndex((cell) => cell.trim().toLowerCase() === name);
  const titleIndex = column("title");
  if (titleIndex < 0) return { candidates: [], invalid: [{ line: 1, reason: "Header needs a title column." }] };

  const candidates: CandidateWork[] = [];
  const invalid: { line: number; reason: string }[] = [];
  if (body.length > MAX_IMPORT_ROWS) {
    invalid.push({ line: 0, reason: `Only the first ${MAX_IMPORT_ROWS} rows are read.` });
  }

  body.slice(0, MAX_IMPORT_ROWS).forEach((cells, index) => {
    const line = index + 2;
    const get = (name: string): string => {
      const at = column(name);
      return at >= 0 ? unguardCell((cells[at] ?? "").trim()) : "";
    };
    const title = get("title");
    if (!title) {
      invalid.push({ line, reason: "Title is empty." });
      return;
    }
    if (title.length > 500) {
      invalid.push({ line, reason: "Title is longer than 500 characters." });
      return;
    }
    const privacy = get("privacy_state") || "public";
    if (privacy === "vault") {
      invalid.push({ line, reason: "Vault rows cannot be imported from CSV." });
      return;
    }
    if (privacy !== "public" && privacy !== "private") {
      invalid.push({ line, reason: `Unknown privacy state: ${privacy}.` });
      return;
    }
    const url = get("access_url");
    if (url && safeHttpUrl(url) === null) {
      invalid.push({ line, reason: "Access URL must be http or https." });
      return;
    }
    candidates.push({
      title,
      contentType: get("content_type") || null,
      genres: splitList(get("genres")),
      tags: splitList(get("tags")),
      privacyState: privacy,
      description: get("description") || null,
      accessUrl: url || null,
      sourceLine: line,
    });
  });

  return { candidates, invalid };
}

function splitList(value: string): string[] {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 50);
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown notes
// ─────────────────────────────────────────────────────────────────────────────

export function memoriesToMarkdown(works: readonly BackupWork[], memories: readonly BackupMemory[]): string {
  const titles = new Map(works.map((work) => [work.id, work.title]));
  const byWork = new Map<string, BackupMemory[]>();
  for (const memory of memories) {
    if (memory.privacyState === "vault") continue;
    const bucket = byWork.get(memory.workId) ?? [];
    bucket.push(memory);
    byWork.set(memory.workId, bucket);
  }

  const sections: string[] = ["# Chronicles Vault notes", ""];
  for (const [workId, items] of byWork) {
    sections.push(`## ${titles.get(workId) ?? workId}`, "");
    for (const memory of items) {
      sections.push(`### ${memory.title?.trim() || "Untitled"}`);
      sections.push(`_${memory.type} · spoiler: ${memory.spoilerLevel} · ${memory.createdAt}_`, "");
      if (memory.body) sections.push(memory.body.trim(), "");
    }
  }
  if (byWork.size === 0) sections.push("No notes yet.", "");
  return sections.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser bookmarks (Netscape bookmark file)
// ─────────────────────────────────────────────────────────────────────────────

export interface BookmarkCandidate {
  readonly title: string;
  readonly url: string;
  readonly folder: string | null;
}

const ANCHOR_PATTERN = /<A\s+[^>]*?HREF="([^"]+)"[^>]*>([\s\S]*?)<\/A>/gi;
const FOLDER_PATTERN = /<H3[^>]*>([\s\S]*?)<\/H3>/gi;

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function parseBookmarksHtml(html: string): BookmarkCandidate[] {
  const text = html.slice(0, MAX_IMPORT_CHARACTERS);
  const folderAt: { index: number; name: string }[] = [];
  for (const match of text.matchAll(FOLDER_PATTERN)) {
    folderAt.push({ index: match.index ?? 0, name: decodeEntities(match[1] ?? "") });
  }

  const seen = new Set<string>();
  const results: BookmarkCandidate[] = [];
  for (const match of text.matchAll(ANCHOR_PATTERN)) {
    if (results.length >= MAX_IMPORT_ROWS) break;
    const index = match.index ?? 0;
    const url = safeHttpUrl(decodeEntities(match[1] ?? ""));
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const folder = folderAt.filter((entry) => entry.index < index).pop()?.name ?? null;
    results.push({ title: decodeEntities(match[2] ?? "") || url, url, folder });
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// URLs and import planning
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the URL without fragment or credentials, or null when it is not http(s). */
export function safeHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export interface ImportPlan<T> {
  readonly create: readonly T[];
  readonly duplicates: readonly { readonly item: T; readonly reason: string }[];
}

export interface ExistingIndex {
  readonly urls: ReadonlySet<string>;
  readonly titles: ReadonlySet<string>;
}

/**
 * Splits candidates into new works and duplicates. A candidate is a duplicate
 * when its access URL already exists, or its normalized title matches an
 * existing or earlier candidate. Nothing is written here.
 */
export function planWorkImport(candidates: readonly CandidateWork[], existing: ExistingIndex): ImportPlan<CandidateWork> {
  const urls = new Set(existing.urls);
  const titles = new Set(existing.titles);
  const create: CandidateWork[] = [];
  const duplicates: { item: CandidateWork; reason: string }[] = [];

  for (const candidate of candidates) {
    const url = candidate.accessUrl ? safeHttpUrl(candidate.accessUrl) : null;
    const key = normalizeTitle(candidate.title);
    if (url && urls.has(url)) {
      duplicates.push({ item: candidate, reason: "Access URL is already in the library." });
      continue;
    }
    if (titles.has(key)) {
      duplicates.push({ item: candidate, reason: "A work with this title already exists." });
      continue;
    }
    create.push(candidate);
    titles.add(key);
    if (url) urls.add(url);
  }
  return { create, duplicates };
}

/** Existing-work index for planning imports. */
export function indexExisting(works: readonly { readonly title: string; readonly urls: readonly string[] }[]): ExistingIndex {
  const urls = new Set<string>();
  const titles = new Set<string>();
  for (const work of works) {
    titles.add(normalizeTitle(work.title));
    for (const url of work.urls) {
      const safe = safeHttpUrl(url);
      if (safe) urls.add(safe);
    }
  }
  return { urls, titles };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown, name: string, errors: string[]): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${name} must be a list.`);
    return [];
  }
  return value;
}

function requireString(value: unknown, name: string, errors: string[], maxLength = 200): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${name} is required.`);
    return null;
  }
  if (value.length > maxLength) {
    errors.push(`${name} is longer than ${maxLength} characters.`);
    return null;
  }
  return value;
}
