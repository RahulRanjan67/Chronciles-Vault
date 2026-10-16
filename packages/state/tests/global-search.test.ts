import { describe, expect, it } from "vitest";
import {
  runGlobalSearch,
  tokenizeQuery,
  makeSnippet,
  safeHost,
  type SearchableWork,
  type SearchableMemory,
  type SearchableFile,
  type GlobalSearchInput,
} from "../src/global-search";

const work = (over: Partial<SearchableWork> = {}): SearchableWork => ({
  id: "w1",
  title: "Tower of God",
  aliases: ["ToG"],
  genres: ["Fantasy", "Action"],
  tags: ["climb"],
  description: "A boy enters a tower that tests every climber.",
  privacyState: "public",
  deletedAt: null,
  mergedIntoWorkId: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  accessPaths: [
    { id: "p1", kind: "web", label: "Naver", url: "https://comic.naver.com/webtoon/list?titleId=312939&token=SECRET" },
  ],
  ...over,
});

const memory = (over: Partial<SearchableMemory> = {}): SearchableMemory => ({
  id: "m1",
  workId: "w1",
  type: "quote",
  title: "Favourite climb",
  body: "The bell tower scene in chapter twelve changed everything.",
  tags: ["bell"],
  spoilerLevel: "spoiler_free",
  privacyState: "public",
  updatedAt: "2026-01-02T00:00:00.000Z",
  ...over,
});

const base = (over: Partial<GlobalSearchInput> = {}): GlobalSearchInput => ({
  query: "",
  works: [work()],
  memories: [memory()],
  files: [],
  vaultNotes: [],
  vaultUnlocked: false,
  ...over,
});

describe("tokenizeQuery", () => {
  it("lowercases, splits on whitespace and caps token count", () => {
    expect(tokenizeQuery("  Tower   OF god ")).toEqual(["tower", "of", "god"]);
    expect(tokenizeQuery("   ")).toEqual([]);
    expect(tokenizeQuery("a b c d e f g h i j")).toHaveLength(8);
  });
});

describe("runGlobalSearch basics", () => {
  it("returns no groups for an empty query", () => {
    expect(runGlobalSearch(base({ query: "   " }))).toEqual([]);
  });

  it("matches works by title and requires every token (AND semantics)", () => {
    const hit = runGlobalSearch(base({ query: "tower god" }));
    expect(hit[0]?.category).toBe("works");
    expect(hit[0]?.results[0]?.title).toBe("Tower of God");

    const miss = runGlobalSearch(base({ query: "tower dragon" }));
    expect(miss.flatMap((g) => g.results).find((r) => r.category === "works")).toBeUndefined();
  });

  it("ranks title matches above description-only matches", () => {
    const groups = runGlobalSearch(
      base({
        query: "tower",
        works: [
          work({ id: "a", title: "Silent Tower Chronicle", description: null }),
          work({ id: "b", title: "Sea Stories", description: "A tower in the distance." }),
        ],
        memories: [],
      }),
    );
    const titles = groups[0]!.results.map((r) => r.title);
    expect(titles[0]).toBe("Silent Tower Chronicle");
  });

  it("orders categories as Works, Memories, Lore, Sources, Files, Private Vault", () => {
    const groups = runGlobalSearch(
      base({
        query: "tower",
        files: [{ id: "f1", displayName: "tower-notes.epub", format: "epub", workId: "w1" }],
      }),
    );
    expect(groups.map((g) => g.category)).toEqual(["works", "memories", "files"]);
  });

  it("limits results per category", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      work({ id: `w${i}`, title: `Echo ${i}`, accessPaths: [] }),
    );
    const groups = runGlobalSearch(base({ query: "echo", works: many, memories: [], limitPerCategory: 5 }));
    expect(groups[0]?.results).toHaveLength(5);
  });
});

describe("privacy rules", () => {
  it("never returns vault works or vault memories", () => {
    const groups = runGlobalSearch(
      base({
        query: "tower",
        works: [work({ privacyState: "vault", id: "hidden", title: "Tower Secret" })],
        memories: [memory({ privacyState: "vault", title: "Tower secret memory" })],
      }),
    );
    expect(groups.flatMap((g) => g.results)).toHaveLength(0);
  });

  it("ignores vault notes entirely while locked, even if passed in", () => {
    const groups = runGlobalSearch(
      base({
        query: "oath",
        works: [],
        memories: [],
        vaultUnlocked: false,
        vaultNotes: [{ id: "n1", title: "Oath draft", body: "secret oath text" }],
      }),
    );
    expect(groups).toEqual([]);
  });

  it("searches vault notes once unlocked, under the Private Vault group", () => {
    const groups = runGlobalSearch(
      base({
        query: "oath",
        works: [],
        memories: [],
        vaultUnlocked: true,
        vaultNotes: [{ id: "n1", title: "Oath draft", body: "a private oath outline" }],
      }),
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.category).toBe("vault");
    expect(groups[0]?.results[0]?.route).toBe("/vault");
    expect(groups[0]?.results[0]?.snippet).toContain("oath");
  });

  it("excludes major-spoiler memories so their existence cannot be probed", () => {
    const groups = runGlobalSearch(
      base({
        query: "twist",
        works: [],
        memories: [memory({ spoilerLevel: "major", title: "Final twist", body: "the twist" })],
      }),
    );
    expect(groups).toEqual([]);
  });

  it("matches minor-spoiler memories on title only and hides their snippet", () => {
    const hiddenBody = runGlobalSearch(
      base({
        query: "lantern",
        works: [],
        memories: [memory({ spoilerLevel: "minor", title: "Scene", body: "lantern in the rain" })],
      }),
    );
    expect(hiddenBody).toEqual([]);

    const titleHit = runGlobalSearch(
      base({
        query: "scene",
        works: [],
        memories: [memory({ spoilerLevel: "minor", title: "Scene", body: "lantern in the rain" })],
      }),
    );
    expect(titleHit[0]?.results[0]?.snippet).toBe("Spoiler-protected. Reveal it in Memory to read.");
  });

  it("never exposes URL paths, query strings or credentials in source results", () => {
    const groups = runGlobalSearch(base({ query: "naver", memories: [] }));
    const sources = groups.find((g) => g.category === "sources");
    expect(sources?.results[0]?.snippet).toBe("comic.naver.com");
    const serialized = JSON.stringify(groups);
    expect(serialized).not.toContain("SECRET");
    expect(serialized).not.toContain("titleId");
  });

  it("separates lore entries from ordinary memories", () => {
    const groups = runGlobalSearch(
      base({
        query: "moons",
        works: [],
        memories: [memory({ type: "lore_entry", title: "Calendar", body: "Thirteen moons per year." })],
      }),
    );
    expect(groups.map((g) => g.category)).toEqual(["lore"]);
  });
});

describe("helpers", () => {
  it("makeSnippet centres on the first match and adds ellipses", () => {
    const text = "x".repeat(100) + " needle " + "y".repeat(100);
    const snippet = makeSnippet(text, ["needle"]);
    expect(snippet).toContain("needle");
    expect(snippet?.startsWith("…")).toBe(true);
    expect(snippet?.endsWith("…")).toBe(true);
  });

  it("safeHost rejects non-HTTP(S) and malformed URLs", () => {
    expect(safeHost("https://example.org/a?b=c")).toBe("example.org");
    expect(safeHost("javascript:alert(1)")).toBeNull();
    expect(safeHost("not a url")).toBeNull();
    expect(safeHost(null)).toBeNull();
  });

  it("finds local files by display name and labels unmatched files", () => {
    const files: SearchableFile[] = [{ id: "f9", displayName: "Vagabond-vol-1.cbz", format: "cbz", workId: null }];
    const groups = runGlobalSearch(base({ query: "vagabond", works: [], memories: [], files }));
    expect(groups[0]?.category).toBe("files");
    expect(groups[0]?.results[0]?.subtitle).toBe("Unmatched file");
  });
});
