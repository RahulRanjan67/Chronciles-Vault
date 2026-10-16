/**
 * Cycle 12 — Transfer Engine Roundtrip Tests
 *
 * Exercises the full export → parse → plan → apply → verify pipeline of the
 * client-facing transfer engine in packages/state/src/transfer/.
 *
 * Distinct from the packages/database vault-export roundtrip (which covers the
 * SQLite layer); these tests cover the browser-side JSON/CSV/Markdown/ZIP and
 * import machinery that the Settings › Data & Backup UI relies on.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  // Core backup
  buildBackup,
  serializeBackup,
  parseBackup,
  BACKUP_FORMAT,
  BACKUP_VERSION,
  VAULT_EXPORT_CONFIRMATION,
  // CSV
  worksToCsv,
  parseWorksCsv,
  planWorkImport,
  indexExisting,
  // Markdown
  memoriesToMarkdown,
  // Bookmarks
  parseBookmarksHtml,
  // Utilities
  safeHttpUrl,
  normalizeTitle,
  escapeCsvCell,
  // Types
  type BackupSnapshot,
  type BackupWork,
  type BackupMemory,
  type BackupList,
  type BackupRelation,
} from "../src/transfer/transfer";

import {
  applyBackupImport,
  applyCandidateImport,
} from "../src/transfer/apply-import";

import {
  validateZipEntryName,
  createStoredZip,
  readStoredZip,
  crc32,
} from "../src/transfer/zip-store";

import { ClientRepository } from "../src/client-repository";
import { ContentType, PersonalState, PrivacyState } from "@chronicles-vault/domain";

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function freshRepo() {
  return new ClientRepository({ empty: true });
}

function makeWork(overrides: Partial<BackupWork> = {}): BackupWork {
  const id = overrides.id ?? `work-test-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: "Test Work",
    aliases: [],
    description: "A test description.",
    contentType: "manga",
    origin: "japanese",
    publicationState: "ongoing",
    privacyState: "public",
    coverRef: null,
    genres: ["Action", "Fantasy"],
    tags: ["test", "vitest"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessPaths: [
      {
        id: `path-${id}`,
        kind: "web",
        label: "Official Site",
        url: `https://example.com/series/${id}`,
        isPreferred: true,
      },
    ],
    ...overrides,
  };
}

function makeMemory(workId: string, overrides: Partial<BackupMemory> = {}): BackupMemory {
  return {
    id: `memory-${Math.random().toString(36).slice(2)}`,
    workId,
    type: "personal_note",
    title: "Test Memory",
    body: "This is a test memory body.",
    spoilerLevel: "spoiler_free",
    privacyState: "public",
    tags: ["note"],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeList(overrides: Partial<BackupList> = {}): BackupList {
  return {
    id: `list-${Math.random().toString(36).slice(2)}`,
    title: "Test List",
    description: "A test list",
    privacyState: "public",
    items: [],
    ...overrides,
  };
}

function makeRelation(sourceWorkId: string, targetWorkId: string): BackupRelation {
  return {
    id: `rel-${Math.random().toString(36).slice(2)}`,
    sourceWorkId,
    targetWorkId,
    relationType: "sequel",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. safeHttpUrl
// ─────────────────────────────────────────────────────────────────────────────

describe("safeHttpUrl", () => {
  it("accepts http URLs", () => {
    expect(safeHttpUrl("http://example.com/path")).toBe("http://example.com/path");
  });

  it("accepts https URLs", () => {
    expect(safeHttpUrl("https://example.com/path?q=1")).toBe("https://example.com/path?q=1");
  });

  it("strips fragment", () => {
    const result = safeHttpUrl("https://example.com/page#section");
    expect(result).not.toContain("#section");
  });

  it("strips credentials", () => {
    const result = safeHttpUrl("https://user:pass@example.com/");
    expect(result).not.toContain("user");
    expect(result).not.toContain("pass");
  });

  it("rejects ftp URLs", () => {
    expect(safeHttpUrl("ftp://example.com/file")).toBeNull();
  });

  it("rejects file:// URLs", () => {
    expect(safeHttpUrl("file:///C:/data/file.txt")).toBeNull();
  });

  it("rejects non-URL strings", () => {
    expect(safeHttpUrl("not-a-url")).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. normalizeTitle
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeTitle", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeTitle("Berserk!")).toBe("berserk");
  });

  it("collapses multiple separators", () => {
    expect(normalizeTitle("Frieren: Beyond Journey's End")).toBe("frieren beyond journey s end");
  });

  it("handles Unicode letters", () => {
    expect(normalizeTitle("全知的なる読者の視点")).not.toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. escapeCsvCell
// ─────────────────────────────────────────────────────────────────────────────

describe("escapeCsvCell", () => {
  it("passes through a plain cell unchanged", () => {
    expect(escapeCsvCell("Berserk")).toBe("Berserk");
  });

  it("quotes cells containing commas", () => {
    expect(escapeCsvCell("Naruto, Shippuden")).toBe('"Naruto, Shippuden"');
  });

  it("escapes embedded double quotes", () => {
    expect(escapeCsvCell(`She said "Hello"`)).toBe(`"She said ""Hello"""`);
  });

  it("prefixes formula-start characters with apostrophe", () => {
    expect(escapeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(escapeCsvCell("+1234")).toBe("'+1234");
    expect(escapeCsvCell("-5")).toBe("'-5");
    expect(escapeCsvCell("@user")).toBe("'@user");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. buildBackup / serializeBackup / parseBackup — roundtrip
// ─────────────────────────────────────────────────────────────────────────────

describe("JSON backup roundtrip", () => {
  const workA = makeWork({ title: "Work Alpha" });
  const workB = makeWork({ title: "Work Beta", privacyState: "private" });
  const memA = makeMemory(workA.id, { title: "Memory A" });
  const memB = makeMemory(workB.id, { title: "Memory B" });
  const listA = makeList({ title: "Favorites" });
  const relation = makeRelation(workA.id, workB.id);

  it("builds a snapshot that round-trips through serialize → parse", () => {
    const snapshot = buildBackup(
      {
        works: [workA, workB],
        memories: [memA, memB],
        lists: [listA],
        relations: [relation],
      },
      { exportedAt: new Date().toISOString() },
    );

    const json = serializeBackup(snapshot);
    const result = parseBackup(json);

    expect(result.ok).toBe(true);
    if (!result.ok) return; // type narrowing

    expect(result.value.format).toBe(BACKUP_FORMAT);
    expect(result.value.version).toBe(BACKUP_VERSION);
    expect(result.value.works.length).toBe(2);
    expect(result.value.memories.length).toBe(2);
    expect(result.value.lists.length).toBe(1);
    expect(result.value.relations.length).toBe(1);
  });

  it("excludes vault works from the snapshot", () => {
    const vaultWork = makeWork({ privacyState: "vault" });
    const snapshot = buildBackup(
      { works: [workA, vaultWork], memories: [], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    expect(snapshot.works.find((w) => w.privacyState === "vault")).toBeUndefined();
    expect(snapshot.works.length).toBe(1);
  });

  it("excludes vault memories from the snapshot", () => {
    const vaultMemory = makeMemory(workA.id, { privacyState: "vault" });
    const snapshot = buildBackup(
      { works: [workA], memories: [memA, vaultMemory], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    expect(snapshot.memories.find((m) => m.privacyState === "vault")).toBeUndefined();
    expect(snapshot.memories.length).toBe(1);
  });

  it("requires VAULT_EXPORT_CONFIRMATION to include vault notes", () => {
    expect(() =>
      buildBackup(
        { works: [workA], memories: [], lists: [], relations: [], vaultNotes: [{ id: "v1", title: "Note", body: "Secret" }] },
        { exportedAt: new Date().toISOString(), includeVault: true },
      ),
    ).toThrow();

    // with the correct phrase it should work
    const ok = buildBackup(
      { works: [workA], memories: [], lists: [], relations: [], vaultNotes: [{ id: "v1", title: "Note", body: "Secret" }] },
      { exportedAt: new Date().toISOString(), includeVault: true, vaultConfirmation: VAULT_EXPORT_CONFIRMATION },
    );
    expect(ok.includesVault).toBe(true);
  });

  it("rejects a backup that has includesVault: true on import", () => {
    const snapshot = buildBackup(
      { works: [workA], memories: [], lists: [], relations: [], vaultNotes: [] },
      { exportedAt: new Date().toISOString(), includeVault: true, vaultConfirmation: VAULT_EXPORT_CONFIRMATION },
    );
    const json = JSON.stringify({ ...JSON.parse(serializeBackup(snapshot)), includesVault: true });
    const result = parseBackup(json);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("vault"))).toBe(true);
    }
  });

  it("rejects a file that is not valid JSON", () => {
    const result = parseBackup("not json");
    expect(result.ok).toBe(false);
  });

  it("rejects a file that is not a Chronicles Vault backup", () => {
    const result = parseBackup(JSON.stringify({ format: "not-cv", version: 1, exportedAt: "x", works: [], memories: [], lists: [], relations: [] }));
    expect(result.ok).toBe(false);
  });

  it("rejects a backup with a non-http access path URL", () => {
    const badWork = makeWork({
      accessPaths: [{ id: "p1", kind: "web", label: "Bad", url: "ftp://example.com", isPreferred: true }],
    });
    const snapshot = buildBackup(
      { works: [badWork], memories: [], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    const result = parseBackup(serializeBackup(snapshot));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("non-http"))).toBe(true);
    }
  });

  it("rejects a memory that references a work not in the backup", () => {
    const orphanMemory = makeMemory("nonexistent-work-id");
    const json = JSON.stringify({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      includesVault: false,
      works: [workA],
      memories: [orphanMemory],
      lists: [],
      relations: [],
    });
    const result = parseBackup(json);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.toLowerCase().includes("work"))).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CSV roundtrip
// ─────────────────────────────────────────────────────────────────────────────

describe("CSV export → import roundtrip", () => {
  it("round-trips a simple work list through worksToCsv → parseWorksCsv", () => {
    const workA = makeWork({ title: "Frieren", genres: ["Fantasy", "Slice of Life"], tags: ["sad", "wholesome"] });
    const workB = makeWork({ title: "Chainsaw Man", genres: ["Action", "Horror"], tags: [] });

    const snapshot = buildBackup(
      { works: [workA, workB], memories: [], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );

    const csv = worksToCsv(snapshot.works);
    const { candidates, invalid } = parseWorksCsv(csv);

    expect(invalid.length).toBe(0);
    expect(candidates.length).toBe(2);
    expect(candidates[0]!.title).toBe("Frieren");
    expect(candidates[0]!.genres).toContain("Fantasy");
    expect(candidates[0]!.genres).toContain("Slice of Life");
    expect(candidates[1]!.title).toBe("Chainsaw Man");
  });

  it("preserves the access URL through CSV roundtrip", () => {
    const work = makeWork({
      title: "Tower of God",
      accessPaths: [{ id: "p1", kind: "web", label: "Webtoon", url: "https://webtoons.com/en/1", isPreferred: true }],
    });
    const snapshot = buildBackup(
      { works: [work], memories: [], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    const csv = worksToCsv(snapshot.works);
    const { candidates } = parseWorksCsv(csv);
    expect(candidates[0]!.accessUrl).toBe("https://webtoons.com/en/1");
  });

  it("rejects vault rows in CSV", () => {
    // Manually write a CSV with vault privacy state
    const csv = "title,privacy_state\nSecret Work,vault\n";
    const { candidates, invalid } = parseWorksCsv(csv);
    expect(candidates.length).toBe(0);
    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid[0]!.reason.toLowerCase()).toContain("vault");
  });

  it("rejects non-http access URLs in CSV", () => {
    const csv = "title,access_url\nBad Work,ftp://bad.example.com\n";
    const { candidates, invalid } = parseWorksCsv(csv);
    expect(candidates.length).toBe(0);
    expect(invalid.some((e) => e.reason.toLowerCase().includes("http"))).toBe(true);
  });

  it("skips rows with empty titles", () => {
    const csv = "title,privacy_state\n,public\nValid Work,public\n";
    const { candidates, invalid } = parseWorksCsv(csv);
    expect(candidates.length).toBe(1);
    expect(candidates[0]!.title).toBe("Valid Work");
    expect(invalid.length).toBe(1);
  });

  it("handles formula-prefixed cells correctly (injection guard)", () => {
    const csv = `title,description\n"'=SUM(1+1)","Normal"\n`;
    const { candidates } = parseWorksCsv(csv);
    // The apostrophe is stripped by unguardCell on import
    expect(candidates[0]!.title).toBe("=SUM(1+1)");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. planWorkImport / indexExisting — duplicate detection
// ─────────────────────────────────────────────────────────────────────────────

describe("planWorkImport duplicate detection", () => {
  it("detects URL duplicate", () => {
    const existing = indexExisting([{ title: "Existing Work", urls: ["https://example.com/existing"] }]);
    const { candidates } = parseWorksCsv(
      "title,access_url\nNew Work,https://example.com/existing\n",
    );
    const plan = planWorkImport(candidates, existing);
    expect(plan.create.length).toBe(0);
    expect(plan.duplicates.length).toBe(1);
    expect(plan.duplicates[0]!.reason).toContain("URL");
  });

  it("detects title duplicate (normalized)", () => {
    const existing = indexExisting([{ title: "Berserk!", urls: [] }]);
    const { candidates } = parseWorksCsv("title\nBerserk\n");
    const plan = planWorkImport(candidates, existing);
    expect(plan.create.length).toBe(0);
    expect(plan.duplicates.length).toBe(1);
    expect(plan.duplicates[0]!.reason.toLowerCase()).toContain("title");
  });

  it("creates new work when no duplicates", () => {
    const existing = indexExisting([{ title: "Frieren", urls: [] }]);
    const { candidates } = parseWorksCsv("title\nBerserk\n");
    const plan = planWorkImport(candidates, existing);
    expect(plan.create.length).toBe(1);
    expect(plan.duplicates.length).toBe(0);
  });

  it("deduplicates within the import batch itself", () => {
    const existing = indexExisting([]);
    const { candidates } = parseWorksCsv("title\nBerserk\nBerserk\n");
    const plan = planWorkImport(candidates, existing);
    expect(plan.create.length).toBe(1);
    expect(plan.duplicates.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. memoriesToMarkdown
// ─────────────────────────────────────────────────────────────────────────────

describe("memoriesToMarkdown", () => {
  it("generates a Markdown document grouped by work", () => {
    const workA = makeWork({ title: "Frieren" });
    const memA = makeMemory(workA.id, { title: "First Memory", body: "Great chapter." });
    const snapshot = buildBackup(
      { works: [workA], memories: [memA], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    const md = memoriesToMarkdown(snapshot.works, snapshot.memories);
    expect(md).toContain("# Chronicles Vault notes");
    expect(md).toContain("## Frieren");
    expect(md).toContain("### First Memory");
    expect(md).toContain("Great chapter.");
  });

  it("excludes vault memories", () => {
    const workA = makeWork({ title: "Work A" });
    const vaultMem = makeMemory(workA.id, { title: "Secret", privacyState: "vault" });
    const snapshot = buildBackup(
      { works: [workA], memories: [vaultMem], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    const md = memoriesToMarkdown(snapshot.works, snapshot.memories);
    expect(md).not.toContain("Secret");
    expect(md).toContain("No notes yet.");
  });

  it("uses untitled fallback when title is null", () => {
    const workA = makeWork({ title: "Work A" });
    const memA = makeMemory(workA.id, { title: null });
    const snapshot = buildBackup(
      { works: [workA], memories: [memA], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    const md = memoriesToMarkdown(snapshot.works, snapshot.memories);
    expect(md).toContain("### Untitled");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. parseBookmarksHtml
// ─────────────────────────────────────────────────────────────────────────────

describe("parseBookmarksHtml", () => {
  const html = `
    <!DOCTYPE NETSCAPE-Bookmark-file-1>
    <DL><p>
      <DT><H3>Manga</H3>
      <DL><p>
        <DT><A HREF="https://example.com/manga1">Manga Title One</A>
        <DT><A HREF="https://example.com/manga2">Manga Title Two</A>
      </DL><p>
      <DT><A HREF="https://example.com/other">Other Link</A>
    </DL>
  `;

  it("parses bookmark links and assigns folder context", () => {
    const bookmarks = parseBookmarksHtml(html);
    expect(bookmarks.length).toBe(3);
    expect(bookmarks[0]!.title).toBe("Manga Title One");
    expect(bookmarks[0]!.folder).toBe("Manga");
    expect(bookmarks[1]!.url).toBe("https://example.com/manga2");
  });

  it("deduplicates repeated URLs", () => {
    const dup = `<DL><DT><A HREF="https://example.com/a">A</A><DT><A HREF="https://example.com/a">A again</A></DL>`;
    const bookmarks = parseBookmarksHtml(dup);
    expect(bookmarks.length).toBe(1);
  });

  it("filters non-http URLs", () => {
    const badHref = `<DL><DT><A HREF="javascript:void(0)">Bad</A></DL>`;
    const bookmarks = parseBookmarksHtml(badHref);
    expect(bookmarks.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. ZIP engine — validateZipEntryName, crc32, createStoredZip, readStoredZip
// ─────────────────────────────────────────────────────────────────────────────

describe("ZIP engine", () => {
  it("validates safe entry names", () => {
    expect(validateZipEntryName("memories.json")).toBeNull();
    expect(validateZipEntryName("subfolder/data.csv")).toBeNull();
  });

  it("rejects path traversal", () => {
    expect(validateZipEntryName("../secrets.txt")).not.toBeNull();
  });

  it("rejects absolute paths", () => {
    expect(validateZipEntryName("/etc/passwd")).not.toBeNull();
  });

  it("rejects backslashes", () => {
    expect(validateZipEntryName("folder\\file.txt")).not.toBeNull();
  });

  it("rejects control characters", () => {
    expect(validateZipEntryName("file\x00name")).not.toBeNull();
  });

  it("rejects empty names", () => {
    expect(validateZipEntryName("")).not.toBeNull();
  });

  it("crc32 is deterministic", () => {
    const enc = new TextEncoder();
    const data = enc.encode("Chronicles Vault");
    expect(crc32(data)).toBe(crc32(data));
    expect(crc32(data)).not.toBe(crc32(enc.encode("Different text")));
  });

  it("round-trips a single text entry through create → read", () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const entries = [{ name: "hello.txt", data: enc.encode("Hello, Chronicles Vault!") }];
    const zip = createStoredZip(entries);
    const read = readStoredZip(zip);
    expect(read.length).toBe(1);
    expect(read[0]!.name).toBe("hello.txt");
    expect(dec.decode(read[0]!.data)).toBe("Hello, Chronicles Vault!");
  });

  it("round-trips multiple entries including JSON", () => {
    const enc = new TextEncoder();
    const payload = JSON.stringify({ format: "test", data: [1, 2, 3] });
    const entries = [
      { name: "works.csv", data: enc.encode("title\nFrieren\n") },
      { name: "backup.json", data: enc.encode(payload) },
    ];
    const zip = createStoredZip(entries);
    const read = readStoredZip(zip);
    expect(read.length).toBe(2);
    expect(read.map((e) => e.name)).toContain("works.csv");
    expect(read.map((e) => e.name)).toContain("backup.json");
    const jsonEntry = read.find((e) => e.name === "backup.json")!;
    expect(JSON.parse(new TextDecoder().decode(jsonEntry.data))).toEqual(JSON.parse(payload));
  });

  it("throws when creating a ZIP with zero entries", () => {
    expect(() => createStoredZip([])).toThrow();
  });

  it("rejects an entry with a path-traversal name in the ZIP", () => {
    const enc = new TextEncoder();
    // We can test this indirectly through validateZipEntryName
    expect(validateZipEntryName("../../evil")).not.toBeNull();
    expect(validateZipEntryName("safe/entry.txt")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Full apply roundtrip: export → parse → plan → applyBackupImport
// ─────────────────────────────────────────────────────────────────────────────

describe("Full backup import roundtrip (export → parse → apply → verify)", () => {
  it("applies a backup into a fresh repository with 100% fidelity", () => {
    const workA = makeWork({ title: "Berserk", genres: ["Action", "Dark Fantasy"], tags: ["iconic"] });
    const workB = makeWork({ title: "Vagabond", genres: ["Historical", "Action"], tags: ["samurai"] });
    const memA = makeMemory(workA.id, { title: "Great chapter note", body: "Chapter 1 was incredible." });
    const relation = makeRelation(workA.id, workB.id);
    const listA = makeList({
      title: "Roundtrip Seinen Masterpieces",
      description: "Restored via backup",
      items: [
        { id: "item-r1", workId: workA.id, position: 0, personalNote: "Peak dark fantasy" },
        { id: "item-r2", workId: workB.id, position: 1, personalNote: "Unrivaled brushwork" },
      ],
    });

    // Step 1: Export
    const snapshot = buildBackup(
      { works: [workA, workB], memories: [memA], lists: [listA], relations: [relation] },
      { exportedAt: new Date().toISOString() },
    );
    const json = serializeBackup(snapshot);

    // Step 2: Parse
    const parseResult = parseBackup(json);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    const parsed = parseResult.value;

    // Step 3: Plan into an empty fresh repository
    const repo = freshRepo();
    const initialCount = repo.getItems().length;
    expect(initialCount).toBe(0);

    const importPlan = planWorkImport(
      parsed.works.map((w) => ({
        title: w.title,
        contentType: w.contentType,
        genres: w.genres as string[],
        tags: w.tags as string[],
        privacyState: (w.privacyState as "public" | "private"),
        description: w.description,
        accessUrl: w.accessPaths.find((p) => p.isPreferred)?.url ?? null,
        sourceLine: 0,
      })),
      { urls: new Set(), titles: new Set() },
    );
    expect(importPlan.create.length).toBe(2);
    expect(importPlan.duplicates.length).toBe(0);

    // Step 4: Apply
    const plannedIds = new Set(parsed.works.map((w) => w.id));
    const result = applyBackupImport(parsed, plannedIds, { repository: repo });

    // Step 5: Verify fidelity
    expect(result.worksCreated).toBe(2);
    expect(result.memoriesCreated).toBe(1);
    expect(result.relationsCreated).toBe(1);
    expect(result.listsRestored).toBe(1);
    expect(result.accessPathsCreated).toBeGreaterThanOrEqual(2);

    // Verify the new works appear in the repository
    const allItems = repo.getItems();
    expect(allItems.length).toBe(2);

    const importedBerserk = allItems.find((i) => i.work.title === "Berserk");
    const importedVagabond = allItems.find((i) => i.work.title === "Vagabond");
    expect(importedBerserk).toBeDefined();
    expect(importedVagabond).toBeDefined();
    expect(importedBerserk!.work.genres).toContain("Action");
    expect(importedBerserk!.work.genres).toContain("Dark Fantasy");
    expect(importedBerserk!.memories.length).toBe(1);
    expect(importedBerserk!.memories[0]!.title).toBe("Great chapter note");
    expect(repo.getAllWorkRelations().length).toBe(1);
  });

  it("does not import works whose IDs are excluded from the plan", () => {
    const workA = makeWork({ title: "Work Included" });
    const workB = makeWork({ title: "Work Excluded" });
    const snapshot = buildBackup(
      { works: [workA, workB], memories: [], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    const parseResult = parseBackup(serializeBackup(snapshot));
    if (!parseResult.ok) throw new Error("Parse failed");

    const repo = freshRepo();
    const before = repo.getItems().length;

    // Only include workA in the plan
    const plannedIds = new Set([workA.id]);
    const result = applyBackupImport(parseResult.value, plannedIds, { repository: repo });

    expect(result.worksCreated).toBe(1);
    const after = repo.getItems();
    expect(after.length).toBe(before + 1);
    expect(after.find((i) => i.work.title === "Work Included")).toBeDefined();
    expect(after.find((i) => i.work.title === "Work Excluded")).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. applyCandidateImport (CSV / bookmark candidate flow)
// ─────────────────────────────────────────────────────────────────────────────

describe("applyCandidateImport", () => {
  it("creates works from CSV candidates", () => {
    const repo = freshRepo();
    const before = repo.getItems().length;

    const { candidates } = parseWorksCsv(
      "title,content_type,genres,tags,access_url\nBleach,manga,Action|Shounen,classic,https://example.com/bleach\n",
    );
    expect(candidates.length).toBe(1);

    const created = applyCandidateImport(candidates, { repository: repo });
    expect(created).toBe(1);
    expect(repo.getItems().length).toBe(before + 1);
    const bleach = repo.getItems().find((i) => i.work.title === "Bleach");
    expect(bleach).toBeDefined();
    expect(bleach!.accessPaths.length).toBe(1);
    expect(bleach!.accessPaths[0]!.url).toBe("https://example.com/bleach");
  });

  it("creates a work with no access path when URL is absent", () => {
    const repo = freshRepo();
    const before = repo.getItems().length;

    const { candidates } = parseWorksCsv("title\nOne Piece\n");
    applyCandidateImport(candidates, { repository: repo });
    expect(repo.getItems().length).toBe(before + 1);
    const op = repo.getItems().find((i) => i.work.title === "One Piece");
    expect(op!.accessPaths.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Privacy invariants: vault records excluded on export and blocked on import
// ─────────────────────────────────────────────────────────────────────────────

describe("Privacy invariants", () => {
  it("vault works do not appear in any export output", () => {
    const vaultWork = makeWork({ privacyState: "vault", title: "Private Secret Work" });
    const normalWork = makeWork({ title: "Normal Work" });
    const snapshot = buildBackup(
      { works: [vaultWork, normalWork], memories: [], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    expect(snapshot.works.find((w) => w.title === "Private Secret Work")).toBeUndefined();
    expect(snapshot.works.find((w) => w.title === "Normal Work")).toBeDefined();

    const csv = worksToCsv(snapshot.works);
    expect(csv).not.toContain("Private Secret Work");
    expect(csv).toContain("Normal Work");
  });

  it("vault memories do not appear in Markdown export", () => {
    const work = makeWork({ title: "Work" });
    const publicMem = makeMemory(work.id, { title: "Public Note", privacyState: "public" });
    const vaultMem = makeMemory(work.id, { title: "Vault Note", privacyState: "vault" });
    const md = memoriesToMarkdown([work], [publicMem, vaultMem]);
    expect(md).toContain("Public Note");
    expect(md).not.toContain("Vault Note");
  });

  it("orphaned memories (work excluded from export) do not appear in output", () => {
    const vaultWork = makeWork({ privacyState: "vault", title: "Vault Work" });
    const orphanMem = makeMemory(vaultWork.id, { title: "Orphan Memory" });
    const snapshot = buildBackup(
      { works: [vaultWork], memories: [orphanMem], lists: [], relations: [] },
      { exportedAt: new Date().toISOString() },
    );
    // vault work is excluded → memories whose workId refers to it are also excluded
    expect(snapshot.memories.find((m) => m.title === "Orphan Memory")).toBeUndefined();
  });
});
