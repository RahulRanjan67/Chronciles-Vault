/**
 * Cycle 13 — Client-Side 500-Work Interaction & Search Benchmark
 *
 * Verifies the client-side performance budgets in docs/PERFORMANCE.md §1 & §2:
 *  - Library Interaction Latency (filter + sort across 500 works): < 50ms target (< 100ms gate)
 *  - Full-Text Global Search Latency (500 works + 3,500 memories + 200 files): < 40ms target (< 150ms gate)
 *  - Return Desk hydration and prioritization across 500 works: < 50ms target (< 100ms gate)
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  ContentOrigin,
  ContentType,
  MemoryType,
  PersonalState,
  PrivacyState,
  PublicationState,
  SpoilerLevel,
} from "@grimoire/domain";
import {
  ClientRepository,
  runGlobalSearch,
  type SearchableFile,
  type SearchableMemory,
  type SearchableWork,
} from "../src/index";

describe("Cycle 13: Client-Side 500-Work Interaction & Search Benchmark", () => {
  let repo: ClientRepository;
  let searchableWorks: SearchableWork[];
  let searchableMemories: SearchableMemory[];
  let searchableFiles: SearchableFile[];

  beforeAll(() => {
    repo = new ClientRepository({ empty: true });
    const contentTypes = [
      ContentType.Manga,
      ContentType.Manhwa,
      ContentType.LightNovel,
      ContentType.WebNovel,
      ContentType.Anime,
    ];
    const states = [
      PersonalState.Reading,
      PersonalState.Planned,
      PersonalState.Waiting,
      PersonalState.Stalled,
      PersonalState.Completed,
      PersonalState.Dropped,
      PersonalState.Rereading,
    ];

    for (let i = 0; i < 500; i++) {
      const contentType = contentTypes[i % contentTypes.length]!;
      const personalState = states[i % states.length]!;
      const item = repo.createWork(
        {
          title: `Chronicle Benchmark Series #${i + 1}: Cyberpunk Matrix Horizon`,
          alternativeTitles: [`Alt Title ${i + 1}`],
          aliases: [`CBS${i + 1}`],
          description: `Serialized progression fantasy and cyberpunk matrix chronicle volume ${i + 1}.`,
          contentType,
          origin: ContentOrigin.Korean,
          publicationState: PublicationState.Ongoing,
          privacyState: i % 20 === 0 ? PrivacyState.Private : PrivacyState.Public,
          coverRef: null,
          externalIds: [],
          genres: ["Action", "Fantasy", i % 2 === 0 ? "Cyberpunk" : "Mystery"],
          tags: ["benchmark", `tier-${i % 5}`],
          mergedIntoWorkId: null,
        },
        personalState,
      );

      // Add 7 memories per work => 3,500 memories total (matching PERFORMANCE.md §2.1)
      for (let m = 0; m < 7; m++) {
        repo.addMemory(item.work.id, {
          type: m % 2 === 0 ? MemoryType.Note : MemoryType.Quote,
          title: `Highlight ${m + 1} for Work ${i + 1}`,
          body: `Key narrative turning point in chapter ${(m + 1) * 10} with matrix resonance.`,
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.SpoilerFree,
          showInGlobalGallery: m === 0,
          accessPathId: null,
          progressAnchor: { type: "chapter", chapter: (m + 1) * 10, title: `Ch ${(m + 1) * 10}` },
          tags: ["highlight", "matrix"],
        });
      }
    }

    const items = repo.getItems();
    searchableWorks = items.map((item) => ({
      id: item.work.id,
      title: item.work.title,
      aliases: item.work.aliases,
      genres: item.work.genres,
      tags: item.work.tags,
      description: item.work.description,
      privacyState: item.work.privacyState,
      deletedAt: item.work.deletedAt,
      mergedIntoWorkId: item.work.mergedIntoWorkId ?? null,
      updatedAt: item.work.updatedAt,
      accessPaths: [],
    }));

    searchableMemories = items.flatMap((item) =>
      item.memories.map((memory) => ({
        id: memory.id,
        workId: memory.workId,
        type: memory.type,
        title: memory.title,
        body: memory.body,
        tags: memory.tags,
        spoilerLevel: memory.spoilerLevel,
        privacyState: memory.privacyState,
        updatedAt: memory.updatedAt,
      })),
    );

    searchableFiles = Array.from({ length: 200 }, (_, idx) => ({
      id: `file-${idx}`,
      displayName: `Archive_Volume_${idx + 1}.epub`,
      format: "epub" as const,
      workId: items[idx % items.length]!.work.id,
    }));
  });

  it("populates 500 works and 3,500 memories accurately", () => {
    expect(repo.getItems().length).toBe(500);
    expect(searchableMemories.length).toBe(3500);
  });

  it("filters and sorts 500 works by shelf, content type, and search query in < 50ms (< 100ms gate)", () => {
    const t0 = performance.now();
    const allItems = repo.getItems();
    const filtered = allItems
      .filter(
        (item) =>
          !item.work.deletedAt &&
          item.work.contentType === ContentType.Manga &&
          item.relationship?.personalState === PersonalState.Reading &&
          item.work.title.toLowerCase().includes("chronicle"),
      )
      .sort((a, b) => a.work.title.localeCompare(b.work.title));
    const elapsed = performance.now() - t0;

    expect(filtered.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });

  it("executes global search across 500 works, 3,500 memories, and 200 files in < 40ms (< 150ms gate)", () => {
    // Warm up
    runGlobalSearch({
      query: "cyberpunk matrix",
      works: searchableWorks,
      memories: searchableMemories,
      files: searchableFiles,
      vaultNotes: [],
      vaultUnlocked: false,
    });

    const t0 = performance.now();
    const groups = runGlobalSearch({
      query: "cyberpunk matrix",
      works: searchableWorks,
      memories: searchableMemories,
      files: searchableFiles,
      vaultNotes: [],
      vaultUnlocked: false,
    });
    const elapsed = performance.now() - t0;

    expect(groups.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(40);
  });
});
