import { describe, expect, it, beforeEach } from "vitest";
import {
  ContentOrigin,
  ContentType,
  MemoryType,
  PersonalState,
  PrivacyState,
  PublicationState,
  SpoilerLevel,
  UpdateCertainty,
} from "@chronicles-vault/domain";
import {
  buildUpdateFeedId,
  ClientRepository,
  evaluatePublication,
  getActiveClientRepository,
  runGlobalSearch,
  useReadingQueueStore,
  useUpdatesStore,
} from "../src";

describe("Cycle 13.5 — Updates Store, Reading Queue, Reread Attempt Gate & Repository Interface", () => {
  beforeEach(() => {
    useUpdatesStore.setState({
      seenIds: [],
      dismissedIds: [],
      snoozedUntil: {},
    });
    useReadingQueueStore.setState({
      items: [],
      isPaused: false,
    });
  });

  it("computes unread updates count and respects markAllSeen, snooze, and dismiss", () => {
    const repo = new ClientRepository({ empty: true });
    const now = new Date("2026-06-10T12:00:00.000Z");
    const created = repo.createWork(
      {
        title: "Chronicle Alpha",
        description: "Test work",
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: [],
        externalIds: [],
        genres: ["Fantasy"],
        tags: [],
      },
      PersonalState.Reading,
    );

    created.updates = [
      {
        workId: created.work.id,
        detectedAt: "2026-06-09T10:00:00.000Z",
        label: "Chapter 10",
        certainty: UpdateCertainty.Confirmed,
        numericIndex: 10,
      },
      {
        workId: created.work.id,
        detectedAt: "2026-06-10T08:00:00.000Z",
        label: "Chapter 11",
        certainty: UpdateCertainty.Confirmed,
        numericIndex: 11,
      },
    ];

    const items = repo.getItems();
    const store = useUpdatesStore.getState();

    expect(store.getUnreadCount(items, now.getTime())).toBe(2);

    const id1 = buildUpdateFeedId(
      created.work.id,
      "2026-06-09T10:00:00.000Z",
      "Chapter 10",
    );
    const id2 = buildUpdateFeedId(
      created.work.id,
      "2026-06-10T08:00:00.000Z",
      "Chapter 11",
    );

    store.markSeen(id1);
    expect(useUpdatesStore.getState().getUnreadCount(items, now.getTime())).toBe(1);

    // Snooze id2 for 24 hours
    useUpdatesStore.getState().snoozeUpdate(id2, 24 * 60 * 60 * 1000, now.getTime());
    expect(useUpdatesStore.getState().isUpdateActive(id2, now.getTime())).toBe(false);
    expect(useUpdatesStore.getState().getUnreadCount(items, now.getTime())).toBe(0);

    // After 25 hours, snooze expires
    const afterSnooze = now.getTime() + 25 * 60 * 60 * 1000;
    expect(useUpdatesStore.getState().isUpdateActive(id2, afterSnooze)).toBe(true);

    // Dismiss hides permanently until restored
    useUpdatesStore.getState().dismissUpdate(id2);
    expect(useUpdatesStore.getState().isUpdateActive(id2, afterSnooze)).toBe(false);

    useUpdatesStore.getState().restoreDismissed(id2);
    expect(useUpdatesStore.getState().isUpdateActive(id2, afterSnooze)).toBe(true);

    useUpdatesStore.getState().markAllSeen([id1, id2]);
    expect(useUpdatesStore.getState().getUnreadCount(items, afterSnooze)).toBe(0);
  });

  it("manages Reading Queue ('Next Up') ordering, pinning, pause state, and auto-suggestions", () => {
    const repo = new ClientRepository({ empty: true });
    const w1 = repo.createWork(
      {
        title: "Work One",
        description: null,
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: [],
        externalIds: [],
        genres: [],
        tags: [],
      },
      PersonalState.Reading,
    );
    const w2 = repo.createWork(
      {
        title: "Work Two",
        description: null,
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        alternativeTitles: [],
        aliases: [],
        externalIds: [],
        genres: [],
        tags: [],
      },
      PersonalState.Paused,
    );
    repo.updateRelationship(w1.work.id, { shelfTier: "priority_watch" });

    const suggestions = useReadingQueueStore
      .getState()
      .getSuggestedWorks(repo.getItems());
    expect(suggestions.length).toBe(2);
    expect(suggestions[0]?.work.id).toBe(w1.work.id);

    useReadingQueueStore.getState().addToQueue(w1.work.id, { estimatedMinutes: 25 });
    useReadingQueueStore.getState().addToQueue(w2.work.id, { estimatedMinutes: 40 });
    expect(useReadingQueueStore.getState().items.map((e) => e.workId)).toEqual([
      w1.work.id,
      w2.work.id,
    ]);

    useReadingQueueStore.getState().moveQueueItem(w2.work.id, "up");
    expect(useReadingQueueStore.getState().items.map((e) => e.workId)).toEqual([
      w2.work.id,
      w1.work.id,
    ]);

    useReadingQueueStore.getState().togglePinQueueItem(w1.work.id);
    expect(
      useReadingQueueStore.getState().items.find((e) => e.workId === w1.work.id)?.pinned,
    ).toBe(true);

    useReadingQueueStore.getState().toggleQueuePaused();
    expect(useReadingQueueStore.getState().isPaused).toBe(true);
  });

  it("blocks publication when a personal note leaks a private reread memory and searches by readingAttemptId", () => {
    const repo = new ClientRepository({ empty: true });
    const w = repo.createWork({
      title: "Time Loop Chronicle",
      description: "Public synopsis",
      contentType: ContentType.WebNovel,
      origin: ContentOrigin.Korean,
      publicationState: PublicationState.Completed,
      privacyState: PrivacyState.Public,
      coverRef: null,
      alternativeTitles: [],
      aliases: [],
      externalIds: [],
      genres: ["Sci-Fi"],
      tags: [],
    });

    const mem = repo.addMemory(w.work.id, {
      type: MemoryType.Note,
      title: "Second Read Realization",
      body: "On second pass I noticed the pocketwatch foreshadowing in chapter three",
      privacyState: PrivacyState.Private,
      spoilerLevel: SpoilerLevel.SpoilerFree,
      readingAttemptId: "reread-2026",
    });

    // Global search finds the memory by readingAttemptId
    const searchGroups = runGlobalSearch({
      query: "reread-2026",
      works: [
        {
          id: w.work.id,
          title: w.work.title,
          alternativeTitles: [],
          aliases: [],
          description: w.work.description,
          genres: w.work.genres,
          tags: w.work.tags,
          privacyState: w.work.privacyState,
          deletedAt: null,
          accessPaths: [],
        },
      ],
      memories: [
        {
          id: mem.id,
          workId: w.work.id,
          type: mem.type,
          title: mem.title,
          body: mem.body,
          tags: mem.tags,
          privacyState: mem.privacyState,
          spoilerLevel: mem.spoilerLevel,
          readingAttemptId: mem.readingAttemptId,
        },
      ],
      files: [],
      vaultUnlocked: false,
    });
    const memGroup = searchGroups.find((g) => g.category === "memories");
    expect(memGroup?.results.some((r) => r.subtitle?.includes("Pass reread-2026"))).toBe(true);

    // Publication scrubber flags reread_attempt_leak if personalNote repeats the private reread memory
    const evaluation = evaluatePublication({
      list: {
        id: "list-1",
        title: "Top Time Loops",
        description: "Recommended loop stories",
        privacyState: PrivacyState.Public,
        items: [
          {
            id: "entry-1",
            workId: w.work.id,
            position: 0,
            personalNote: "I noticed the pocketwatch foreshadowing in chapter three",
          },
        ],
      },
      works: [
        {
          id: w.work.id,
          title: w.work.title,
          author: null,
          contentType: w.work.contentType,
          genres: w.work.genres,
          tags: w.work.tags,
          synopsis: w.work.description,
          privacyState: w.work.privacyState,
          coverRef: null,
          totalChapters: null,
          rating: null,
        },
      ],
      excludedEntryIds: [],
      privateSources: [
        {
          label: "private reread memory",
          text: "On reread-2026 I noticed the pocketwatch foreshadowing in chapter three",
          readingAttemptId: "reread-2026",
        },
      ],
      vaultStatus: "uninitialized",
      generatedAt: "2026-06-10T12:00:00.000Z",
    });

    expect(evaluation.status).toBe("blocked");
    if (evaluation.status === "blocked") {
      expect(evaluation.findings.some((f) => f.kind === "reread_attempt_leak")).toBe(true);
    }
  });

  it("exposes the unified ADR-010 IChroniclesRepository / ClientDataRepository contract and normalizers", async () => {
    const {
      getActiveRepository,
      browserRepository,
      BrowserRepositoryAdapter,
    } = await import("../src");
    const {
      normalizeProgressAnchor,
      normalizeAccessPathHealth,
      normalizePrivacyState,
      SourceHealth,
    } = await import("@chronicles-vault/domain");

    const active = getActiveClientRepository();
    expect(active).toBe(getActiveRepository());
    expect(active).toBe(browserRepository);
    expect(browserRepository).toBeInstanceOf(BrowserRepositoryAdapter);
    expect(typeof active.getItems).toBe("function");
    expect(typeof active.updateRelationship).toBe("function");
    expect(typeof active.linkWorkRelation).toBe("function");

    // Verify unified ProgressAnchor normalizer (type vs kind, chapter vs chapterNumber, percent vs percentage)
    expect(normalizeProgressAnchor({ kind: "chapter", chapterNumber: 42 })).toEqual({
      type: "chapter",
      chapter: 42,
    });
    expect(normalizeProgressAnchor({ type: "percentage", percentage: 75.5 })).toEqual({
      type: "percent",
      percent: 75.5,
    });
    expect(normalizeProgressAnchor({ kind: "epub_cfi", cfi: "epubcfi(/6/4!)", percentage: 30 })).toEqual({
      type: "epub_locator",
      cfi: "epubcfi(/6/4!)",
      percent: 30,
    });

    // Verify unified SourceHealth normalizer (health vs healthState)
    expect(normalizeAccessPathHealth({ healthState: SourceHealth.Degraded })).toBe(
      SourceHealth.Degraded,
    );
    expect(
      normalizeAccessPathHealth({
        health: SourceHealth.Healthy,
        healthState: SourceHealth.Stale,
      }),
    ).toBe(SourceHealth.Healthy);

    // Verify unified PrivacyState normalizer (PrivacyState vs MemoryPrivacyState)
    expect(normalizePrivacyState("normal")).toBe(PrivacyState.Public);
    expect(normalizePrivacyState("private")).toBe(PrivacyState.Private);
    expect(normalizePrivacyState("vault")).toBe(PrivacyState.Vault);

    // Verify unified ReadingQueue action aliases
    const qState = useReadingQueueStore.getState();
    expect(qState.togglePin).toBe(qState.togglePinQueueItem);
    expect(qState.setTargetDate).toBe(qState.setQueueTargetDate);
    expect(qState.setEstimatedMinutes).toBe(qState.setQueueEstimatedMinutes);
    expect(qState.togglePaused).toBe(qState.toggleQueuePaused);
    expect(qState.suggestNextWorks).toBe(qState.getSuggestedWorks);
  });
});
