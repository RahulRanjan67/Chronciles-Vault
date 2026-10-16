import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { WorkId } from "@chronicles-vault/shared";

import {
  // Work
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  createWork,
  applyWorkPatch,
  toWorkSummary,
  validateWorkInvariant,
  // Reading
  PersonalState,
  ReadingPriority,
  createReadingRelationship,
  applyReadingRelationshipPatch,
  createReadingAttempt,
  createReadingSession,
  // Progress
  ProgressMethod,
  ProgressConfidence,
  formatProgressAnchor,
  extractNumericProgress,
  validateProgressAnchor,
  createProgressEvent,
  // Access Path
  AccessPathKind,
  AccessCapability,
  SourceHealth,
  createWebAccessPath,
  createLocalFileAccessPath,
  createFeedAccessPath,
  createManualAccessPath,
  applyAccessPathPatch,
  toAccessPathSummary,
  selectFallbackAccessPath,
  // Memory
  MemoryType,
  SpoilerLevel,
  createMemory,
  applyMemoryPatch,
  createMemoryAsset,
  // Capture
  CaptureState,
  createCapture,
  applyCapturePatch,
  createCaptureBatch,
  // Lore
  LoreEntityType,
  createLoreEntry,
  // Work Relation
  RelationType,
  createWorkRelation,
  validateWorkRelationInvariant,
  // Archive
  ArchiveReason,
  createArchiveRecord,
  // List
  createUserList,
  createListItem,
  // Publication
  createPublication,
  createPublicationItem,
  // Events
  createDomainEvent,
  // Return
  ReturnSignalType,
  createReturnSignal,
  computeReturnSignals,
  createUpdateEntry,
  UpdateCertainty,
  applyUpdateCertaintyValidity,
  createHealthMonitorState,
  recordHealthCheckFailure,
  recordHealthCheckSuccess,
  createConditionalRequestHeaders,
  carryForwardConditionalValidators,
  type HealthMonitorState,
  // Deduplication
  calculateUrlSimilarity,
  calculateTitleSimilarity,
  detectDuplicate,
  calculateWorkSimilarity,
  DuplicateConfidence,
  // URL Normalization
  normalizeUrl,
} from "../dist/index.js";

describe("Chronicles Vault Domain Model Tests", () => {
  describe("Work Entity", () => {
    it("creates an immutable work with valid invariants", () => {
      const work = createWork({
        title: "Solo Leveling",
        alternativeTitles: ["Na Honjaman Level Up"],
        aliases: ["SL"],
        description: "E-rank hunter Sung Jin-woo becomes the shadow monarch.",
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: "assets/covers/sl.jpg",
        externalIds: [],
        genres: ["Action", "Fantasy"],
        tags: ["Overpowered MC", "System"],
        rating: null,
      });

      assert.equal(work.title, "Solo Leveling");
      assert.equal(work.contentType, ContentType.Manhwa);
      assert.equal(work.origin, ContentOrigin.Korean);
      assert.ok(work.id);
      assert.equal(work.deletedAt, null);

      // Verify invariant failure on blank title
      assert.throws(() => {
        validateWorkInvariant({ title: "   " });
      }, /must not be blank/);
    });

    it("patches a work immutably without altering the original", () => {
      const work = createWork({
        title: "Original Title",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const updated = applyWorkPatch(work, {
        title: "Updated Title",
        publicationState: PublicationState.Completed,
      });

      assert.notEqual(work, updated);
      assert.equal(work.title, "Original Title");
      assert.equal(updated.title, "Updated Title");
      assert.equal(updated.publicationState, PublicationState.Completed);
    });

    it("projects a work to WorkSummary correctly", () => {
      const work = createWork({
        title: "Omniscient Reader",
        alternativeTitles: ["ORV"],
        aliases: ["ORV"],
        description: "Heavy description text...",
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: "orv.png",
        externalIds: [],
        genres: ["Action"],
        tags: ["Regression"],
        rating: null,
      });

      const summary = toWorkSummary(work);
      assert.equal(summary.id, work.id);
      assert.equal(summary.title, "Omniscient Reader");
      assert.equal("description" in summary, false);
    });

    it("work survives independently of access paths - core permanence principle", () => {
      // A Work exists independently of its AccessPaths
      // Even if all sources disappear, the Work remains
      const work = createWork({
        title: "The Ashen Crown",
        alternativeTitles: [],
        aliases: [],
        description: "A fantasy epic about lost kingdoms",
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: ["Fantasy"],
        tags: [],
      });

      // Work has a stable ID independent of any source
      assert.ok(work.id);
      assert.equal(work.title, "The Ashen Crown");

      // Work can be patched without any AccessPath reference
      const updated = applyWorkPatch(work, {
        publicationState: PublicationState.Completed,
      });

      assert.equal(updated.title, "The Ashen Crown");
      assert.equal(updated.publicationState, PublicationState.Completed);
      assert.notEqual(work, updated);

      // This verifies the core principle: Work identity is permanent
      // URL is not Work identity
      // AccessPath is separate from Work
    });
  });

  describe("Progress Anchors & Events", () => {
    it("formats various progress anchor types into human-readable strings", () => {
      assert.equal(formatProgressAnchor({ type: "chapter", chapter: 10 }), "Ch. 10");
      assert.equal(
        formatProgressAnchor({ type: "chapter", chapter: 10, subchapter: 5, title: "The Fall" }),
        "Ch. 10.5 - The Fall",
      );
      assert.equal(
        formatProgressAnchor({ type: "episode", episode: 7, timecode: "12:34" }),
        "Ep. 7 (12:34)",
      );
      assert.equal(formatProgressAnchor({ type: "page", page: 88, totalPages: 250 }), "p. 88/250");
      assert.equal(formatProgressAnchor({ type: "percent", percent: 42.8 }), "43%");
      assert.equal(
        formatProgressAnchor({ type: "epub_locator", cfi: "cfi/12", chapterTitle: "Prologue" }),
        "Prologue",
      );
      assert.equal(
        formatProgressAnchor({ type: "volume_chapter", volume: 2, chapter: 4 }),
        "Vol. 2 Ch. 4",
      );
      assert.equal(
        formatProgressAnchor({ type: "provider", locator: "loc-1", display: "Act 1" }),
        "Act 1",
      );
    });

    it("extracts comparable numeric progress", () => {
      assert.equal(extractNumericProgress({ type: "chapter", chapter: 14, subchapter: 5 }), 14.5);
      assert.equal(extractNumericProgress({ type: "page", page: 120 }), 120);
      assert.equal(extractNumericProgress({ type: "percent", percent: 65 }), 65);
    });

    it("validates progress anchors strictly", () => {
      assert.throws(() => {
        validateProgressAnchor({ type: "chapter", chapter: -5 });
      }, /non-negative/);

      assert.throws(() => {
        validateProgressAnchor({ type: "percent", percent: 105 });
      }, /between 0 and 100/);

      assert.throws(() => {
        validateProgressAnchor({ type: "page", page: 200, totalPages: 100 });
      }, /cannot exceed totalPages/);
    });

    it("creates a validated progress event", () => {
      const event = createProgressEvent({
        workId: "work-1" as any,
        method: ProgressMethod.Reader,
        confidence: ProgressConfidence.Confirmed,
        anchorBefore: { type: "chapter", chapter: 5 },
        anchorAfter: { type: "chapter", chapter: 6 },
      });

      assert.ok(event.id);
      assert.equal(event.anchorAfter.type, "chapter");
      assert.equal((event.anchorAfter as any).chapter, 6);
    });
  });

  describe("Access Paths", () => {
    it("creates web, local file, feed, and manual access paths with proper discriminators", () => {
      const web = createWebAccessPath({
        workId: "work-1" as any,
        url: "https://example.com/manga/123",
        label: "Official Site",
        isPreferred: true,
        health: SourceHealth.Healthy,
        capabilities: [AccessCapability.Read, AccessCapability.Updates],
        provider: "example",
      });

      assert.equal(web.kind, AccessPathKind.Web);
      assert.equal(web.url, "https://example.com/manga/123");

      const local = createLocalFileAccessPath({
        workId: "work-1" as any,
        filePath: "C:/books/novel.epub",
        label: "Local EPUB",
        isPreferred: false,
        health: SourceHealth.Local,
        capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
        fileId: "file-123",
        format: "epub",
      });

      assert.equal(local.kind, AccessPathKind.LocalFile);
      assert.equal(local.filePath, "C:/books/novel.epub");

      const summary = toAccessPathSummary(web);
      assert.equal(summary.kind, AccessPathKind.Web);
      assert.equal(summary.isPreferred, true);

      const patched = applyAccessPathPatch(web, { health: SourceHealth.Degraded });
      assert.equal(patched.health, SourceHealth.Degraded);
    });
  });

  describe("Reading Relationships", () => {
    it("creates and patches reading relationship with state auto-timestamps", () => {
      const rel = createReadingRelationship({
        workId: "work-1" as any,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 1 },
        preferredAccessPathId: null,
      });

      assert.equal(rel.personalState, PersonalState.Reading);
      assert.equal(rel.priority, ReadingPriority.High);

      const completed = applyReadingRelationshipPatch(rel, {
        personalState: PersonalState.Completed,
      });

      assert.equal(completed.personalState, PersonalState.Completed);
      assert.ok(completed.completedAt !== null);

      const attempt = createReadingAttempt({
        workId: "work-1" as any,
        readingRelationshipId: rel.id,
        attemptNumber: 1,
        startedAt: new Date().toISOString(),
        endedAt: null,
        finalAnchor: null,
        notes: "First read-through",
      });

      assert.equal(attempt.attemptNumber, 1);
    });
  });

  describe("Memories, Captures, Lore, and Archive", () => {
    it("creates a memory with assets and spoiler level", () => {
      const memory = createMemory({
        workId: "work-1" as any,
        type: MemoryType.Quote,
        title: "Iconic line",
        body: "Arise.",
        privacyState: PrivacyState.Public,
        spoilerLevel: SpoilerLevel.SpoilerFree,
        showInGlobalGallery: true,
        accessPathId: null,
        progressAnchor: { type: "chapter", chapter: 45 },
      });

      assert.equal(memory.type, MemoryType.Quote);
      assert.equal(memory.body, "Arise.");

      const asset = createMemoryAsset({
        memoryId: memory.id,
        assetType: "image",
        fileId: "asset-img-1",
        thumbnailRef: "thumb.jpg",
        width: 1920,
        height: 1080,
      });
      assert.equal(asset.fileId, "asset-img-1");
    });

    it("enforces lore and work relation invariants", () => {
      const lore = createLoreEntry({
        workId: "work-1" as any,
        entityType: LoreEntityType.Character,
        name: "Shadow Monarch",
        aliases: ["Ashborn"],
        description: "King of the Dead",
        notes: null,
        relations: [],
        firstAppearsAnchor: { type: "chapter", chapter: 100 },
        tags: ["Monarch"],
      });

      assert.equal(lore.name, "Shadow Monarch");

      assert.throws(() => {
        createWorkRelation({
          sourceWorkId: "w-1" as any,
          targetWorkId: "w-1" as any,
          relationType: RelationType.Sequel,
          description: null,
        });
      }, /cannot be related to itself/);
    });

    it("creates an archive record with previous progress snapshot", () => {
      const archive = createArchiveRecord({
        workId: "work-1" as any,
        reason: ArchiveReason.Dropped,
        note: "Pacing dragged after arc 3",
        previousState: PersonalState.Reading,
        previousProgress: { type: "chapter", chapter: 34 },
      });

      assert.equal(archive.reason, ArchiveReason.Dropped);
      assert.equal(archive.previousProgress?.type, "chapter");
    });
  });

  describe("Domain Events", () => {
    it("creates domain events with discriminating types and typed payloads", () => {
      const event = createDomainEvent("relationship.completed", {
        relationshipId: "rel-1" as any,
        workId: "work-1" as any,
        completedAt: new Date().toISOString(),
      });

      assert.equal(event.type, "relationship.completed");
      assert.ok(event.id);
      assert.ok(event.timestamp);
      assert.equal(event.payload.workId, "work-1");
    });
  });

  describe("Return Engine Use Case", () => {
    it("computes ContinueNow signal for recently active works", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const oneDayAgo = new Date("2026-10-03T12:00:00Z").toISOString();

      const rel = createReadingRelationship({
        workId: "work-1" as any,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.Normal,
        startedAt: oneDayAgo,
        lastActiveAt: oneDayAgo,
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 12 },
        preferredAccessPathId: null,
      });

      const signals = computeReturnSignals([rel], new Map(), now);
      assert.equal(signals.length, 1);
      assert.equal(signals[0]?.type, ReturnSignalType.ContinueNow);
      assert.equal(signals[0]?.workId, "work-1");
    });

    it("computes CatchUp signal when new updates are detected ahead of current anchor", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const rel = createReadingRelationship({
        workId: "work-2" as any,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: null,
        lastActiveAt: new Date("2026-10-01T12:00:00Z").toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 50 },
        preferredAccessPathId: null,
      });

      const update = createUpdateEntry({
        workId: "work-2" as any,
        label: "Chapter 57",
        numericIndex: 57,
        certainty: UpdateCertainty.Confirmed,
      });

      const updatesMap = new Map([["work-2" as any, [update]]]);
      const signals = computeReturnSignals([rel], updatesMap, now);

      assert.equal(signals.length, 1);
      assert.equal(signals[0]?.type, ReturnSignalType.CatchUp);
      assert.equal(signals[0]?.newMaterialCount, 7);
    });

    it("computes BingeReady signal for paused works with substantial new material", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const rel = createReadingRelationship({
        workId: "work-3" as any,
        personalState: PersonalState.Paused,
        priority: ReadingPriority.Normal,
        startedAt: null,
        lastActiveAt: new Date("2026-08-01T12:00:00Z").toISOString(),
        completedAt: null,
        stoppedAt: new Date("2026-08-01T12:00:00Z").toISOString(),
        stoppedReason: "Waiting for chapters",
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 20 },
        preferredAccessPathId: null,
      });

      const update = createUpdateEntry({
        workId: "work-3" as any,
        label: "Chapter 32",
        numericIndex: 32,
        certainty: UpdateCertainty.Confirmed,
      });

      const updatesMap = new Map([["work-3" as any, [update]]]);
      const signals = computeReturnSignals([rel], updatesMap, now);

      assert.equal(signals.length, 1);
      assert.equal(signals[0]?.type, ReturnSignalType.BingeReady);
      assert.equal(signals[0]?.newMaterialCount, 12);
    });

    it("computes an explainable Stalled signal after the inactivity threshold", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const lastActiveAt = new Date("2026-08-01T12:00:00Z").toISOString();
      const rel = createReadingRelationship({
        workId: "work-stalled" as any,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.Normal,
        startedAt: lastActiveAt,
        lastActiveAt,
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 20 },
        preferredAccessPathId: null,
      });

      const [signal] = computeReturnSignals([rel], new Map(), now);
      assert.equal(signal?.type, ReturnSignalType.Stalled);
      assert.match(signal?.explanation ?? "", /64 days/);
      assert.equal(signal?.daysSinceActivity, 64);
    });

    it("computes Waiting for a work caught up with its source", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const rel = createReadingRelationship({
        workId: "work-waiting" as any,
        personalState: PersonalState.Waiting,
        priority: ReadingPriority.Normal,
        startedAt: null,
        lastActiveAt: new Date("2026-10-01T12:00:00Z").toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 20 },
        preferredAccessPathId: null,
      });

      const [signal] = computeReturnSignals([rel], new Map(), now);
      assert.equal(signal?.type, ReturnSignalType.Waiting);
      assert.match(signal?.explanation ?? "", /awaiting new chapter drops/);
    });

    it("computes Rediscover for old paused and completed works", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const stoppedAt = new Date("2026-08-01T12:00:00Z").toISOString();
      const paused = createReadingRelationship({
        workId: "work-paused-rediscover" as any,
        personalState: PersonalState.Paused,
        priority: ReadingPriority.Normal,
        startedAt: null,
        lastActiveAt: null,
        completedAt: null,
        stoppedAt,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 20 },
        preferredAccessPathId: null,
      });
      const completed = createReadingRelationship({
        workId: "work-completed-rediscover" as any,
        personalState: PersonalState.Completed,
        priority: ReadingPriority.Normal,
        startedAt: null,
        lastActiveAt: null,
        completedAt: stoppedAt,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 30 },
        preferredAccessPathId: null,
      });

      const signals = computeReturnSignals([paused, completed], new Map(), now);
      assert.equal(signals.length, 2);
      assert.ok(signals.every((signal) => signal.type === ReturnSignalType.Rediscover));
      assert.ok(signals.every((signal) => signal.daysSinceActivity === 64));
      assert.ok(signals.every((signal) => signal.explanation.includes("64 days")));
    });
  });

  describe("URL Normalization", () => {
    it("normalizes URLs by removing tracking parameters", () => {
      const result = normalizeUrl(
        "https://example.com/page?utm_source=google&utm_medium=email&id=123",
      );
      assert.equal(result.isValid, true);
      assert.equal(result.normalizedUrl, "https://example.com/page?id=123");
      assert.equal(result.strippedParams.length, 2);
      assert.ok(result.strippedParams.includes("utm_source"));
      assert.ok(result.strippedParams.includes("utm_medium"));
    });

    it("removes Facebook click IDs and Google click IDs", () => {
      const result = normalizeUrl("https://example.com/page?fbclid=test123&gclid=test456");
      assert.equal(result.isValid, true);
      assert.equal(result.normalizedUrl, "https://example.com/page");
      assert.ok(result.strippedParams.includes("fbclid"));
      assert.ok(result.strippedParams.includes("gclid"));
    });

    it("strips referral, session, and cache-busting parameters", () => {
      const result = normalizeUrl(
        "https://example.com/chapter?session_id=secret&jsessionid=secret&phpsessid=secret&_=&v=2&t=3&timestamp=4&aff=5&affiliate=6&yclid=7&chapter=12",
      );
      assert.equal(result.normalizedUrl, "https://example.com/chapter?chapter=12");
      assert.equal(result.strippedParams.length, 10);
    });

    it("canonicalizes host by lowercasing", () => {
      const result = normalizeUrl("https://EXAMPLE.COM/PATH");
      assert.equal(result.hostname, "example.com");
      assert.equal(result.normalizedUrl, "https://example.com/PATH");
    });

    it("removes trailing slashes from paths", () => {
      const result = normalizeUrl("https://example.com/path/");
      assert.equal(result.path, "/path");
      assert.equal(result.normalizedUrl, "https://example.com/path");
    });

    it("preserves meaningful query parameters", () => {
      const result = normalizeUrl("https://mangadex.org/title/123?chapter=5&page=10");
      assert.equal(result.isValid, true);
      assert.ok(result.normalizedUrl.includes("chapter=5"));
      assert.ok(result.normalizedUrl.includes("page=10"));
    });

    it("extracts root domain correctly", () => {
      const result1 = normalizeUrl("https://reader.mangadex.org/title/123");
      assert.equal(result1.domain, "mangadex.org");

      const result2 = normalizeUrl("https://www.example.co.uk/page");
      assert.equal(result2.domain, "example.co.uk");
    });

    it("extracts clean slug from path", () => {
      const result = normalizeUrl("https://example.com/manga/solo-leveling-chapter-1");
      assert.equal(result.cleanSlug, "solo-leveling-chapter-1");
      assert.equal(result.slug, "solo-leveling-chapter-1");
    });

    it("handles invalid URLs gracefully", () => {
      const result = normalizeUrl("not-a-url");
      assert.equal(result.isValid, false);
      assert.equal(result.normalizedUrl, "");
    });

    it("rejects non-HTTP protocols", () => {
      const result = normalizeUrl("ftp://example.com/file");
      assert.equal(result.isValid, false);
      assert.equal(result.scheme, "ftp");
    });

    it("removes URL fragments", () => {
      const result = normalizeUrl("https://example.com/page#section");
      assert.equal(result.normalizedUrl, "https://example.com/page");
    });

    it("sorts query parameters deterministically", () => {
      const result = normalizeUrl("https://example.com?z=1&a=2&m=3");
      assert.equal(result.normalizedUrl, "https://example.com?a=2&m=3&z=1");
    });
  });

  describe("Deduplication Engine", () => {
    it("calculates URL similarity for identical URLs", () => {
      const sim = calculateUrlSimilarity(
        "https://example.com/manga/test",
        "https://example.com/manga/test",
      );
      assert.equal(sim, 1.0);
    });

    it("calculates URL similarity for URLs with tracking params", () => {
      const sim = calculateUrlSimilarity(
        "https://example.com/manga/test?utm_source=google",
        "https://example.com/manga/test",
      );
      assert.equal(sim, 1.0);
    });

    it("calculates URL similarity for same domain and slug", () => {
      const sim = calculateUrlSimilarity(
        "https://example.com/manga/solo-leveling",
        "https://example.com/manga/solo-leveling?chapter=1",
      );
      assert.equal(sim, 0.95);
    });

    it("returns zero similarity for different domains", () => {
      const sim = calculateUrlSimilarity("https://example.com/page", "https://other.com/page");
      assert.equal(sim, 0.0);
    });

    it("calculates title similarity for identical titles", () => {
      const sim = calculateTitleSimilarity("Solo Leveling", "Solo Leveling");
      assert.equal(sim, 1.0);
    });

    it("calculates title similarity for case-insensitive match", () => {
      const sim = calculateTitleSimilarity("Solo Leveling", "solo leveling");
      assert.equal(sim, 1.0);
    });

    it("calculates title similarity for substring match", () => {
      const sim = calculateTitleSimilarity("Solo Leveling", "Solo Leveling: Ragnarok");
      assert.equal(sim, 0.85);
    });

    it("calculates title similarity using Levenshtein distance", () => {
      const sim = calculateTitleSimilarity("Solo Leveling", "Solo Levelling");
      assert.ok(sim >= 0.9);
    });

    it("detects duplicate by exact URL match", () => {
      const work = createWork({
        title: "Solo Leveling",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [
          { provider: "mangadex", externalId: "123", url: "https://mangadex.org/title/123" },
        ],
        genres: [],
        rating: null,
        tags: [],
      });

      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: "https://mangadex.org/title/123",
        normalizedUrl: null,
        title: "Solo Leveling",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      const result = detectDuplicate(capture, [work]);
      assert.equal(result.isDuplicate, true);
      assert.equal(result.bestMatch?.workId, work.id);
      assert.equal(result.bestMatch?.confidence, DuplicateConfidence.Exact);
    });

    it("detects duplicate by title similarity", () => {
      const work = createWork({
        title: "Solo Leveling",
        alternativeTitles: ["Na Honjaman Level Up"],
        aliases: ["SL"],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: "https://example.com/solo-leveling",
        normalizedUrl: null,
        title: "Solo Leveling",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      const result = detectDuplicate(capture, [work]);
      assert.equal(result.isDuplicate, true);
      assert.equal(result.bestMatch?.confidence, DuplicateConfidence.Exact);
    });

    it("detects duplicate by alternative title", () => {
      const work = createWork({
        title: "Solo Leveling",
        alternativeTitles: ["Na Honjaman Level Up"],
        aliases: [],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: null,
        normalizedUrl: null,
        title: "Na Honjaman Level Up",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      const result = detectDuplicate(capture, [work]);
      assert.equal(result.isDuplicate, true);
      assert.ok(result.bestMatch?.reasons.some((r) => r.includes("alternative")));
    });

    it("detects duplicate by alias", () => {
      const work = createWork({
        title: "Solo Leveling",
        alternativeTitles: [],
        aliases: ["SL"],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: null,
        normalizedUrl: null,
        title: "SL",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      const result = detectDuplicate(capture, [work]);
      assert.equal(result.isDuplicate, true);
      assert.ok(result.bestMatch?.reasons.some((r) => r.includes("alias")));
    });

    it("returns no duplicate for insufficient matches", () => {
      const work = createWork({
        title: "Solo Leveling",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: null,
        normalizedUrl: null,
        title: "Completely Different Title",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      const result = detectDuplicate(capture, [work]);
      assert.equal(result.isDuplicate, false);
      assert.equal(result.bestMatch, null);
    });

    it("ranks multiple candidates by score", () => {
      const work1 = createWork({
        title: "Solo Leveling",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const work2 = createWork({
        title: "Solo Leveling: Ragnarok",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: null,
        normalizedUrl: null,
        title: "Solo Leveling",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      const result = detectDuplicate(capture, [work2, work1]);
      assert.equal(result.candidates.length, 2);
      assert.equal(result.candidates[0]?.workId, work1.id); // Better match first
      assert.ok(result.candidates[0]?.score >= result.candidates[1]?.score);
    });

    it("calculates work similarity by external ID", () => {
      const work1 = createWork({
        title: "Solo Leveling",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [{ provider: "mangadex", externalId: "123" }],
        genres: [],
        rating: null,
        tags: [],
      });

      const work2 = createWork({
        title: "Different Title",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [{ provider: "mangadex", externalId: "123" }],
        genres: [],
        rating: null,
        tags: [],
      });

      const sim = calculateWorkSimilarity(work1, work2);
      assert.equal(sim, 1.0); // Same external ID = same work
    });

    it("calculates work similarity by title", () => {
      const work1 = createWork({
        title: "Solo Leveling",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const work2 = createWork({
        title: "Solo Leveling",
        alternativeTitles: [],
        aliases: [],
        description: null,
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: null,
        externalIds: [],
        genres: [],
        rating: null,
        tags: [],
      });

      const sim = calculateWorkSimilarity(work1, work2);
      assert.equal(sim, 1.0);
    });
  });

  describe("Capture Entity Integration", () => {
    it("auto-normalizes URL when creating a capture", () => {
      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: "https://EXAMPLE.COM/page?utm_source=google&id=123",
        normalizedUrl: null,
        title: "Test Page",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      assert.equal(capture.url, "https://EXAMPLE.COM/page?utm_source=google&id=123");
      assert.equal(capture.normalizedUrl, "https://example.com/page?id=123");
    });

    it("preserves manually provided normalized URL", () => {
      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: "https://example.com/page",
        normalizedUrl: "https://custom-normalized.com/page",
        title: "Test Page",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      assert.equal(capture.normalizedUrl, "https://custom-normalized.com/page");
    });

    it("auto-normalizes URL when patching a capture", () => {
      const capture = createCapture({
        id: "cap-1" as any,
        batchId: null,
        url: "https://example.com/old",
        normalizedUrl: null,
        title: "Old Title",
        faviconRef: null,
        capturedAt: new Date().toISOString(),
        possibleWorkId: null,
        confidenceScore: null,
        state: CaptureState.Pending,
      });

      const updated = applyCapturePatch(capture, {
        url: "https://EXAMPLE.COM/new?utm_source=test",
      });

      assert.equal(updated.url, "https://EXAMPLE.COM/new?utm_source=test");
      assert.equal(updated.normalizedUrl, "https://example.com/new");
    });
  });

  describe("Source Health and Update Certainty Policies", () => {
    const start = "2026-10-05T00:00:00.000Z";

    it("applies the documented failure delays and health transitions", () => {
      let state = createHealthMonitorState(SourceHealth.Healthy);
      const expectedDelays = [15, 60, 360, 360];

      expectedDelays.forEach((minutes, index) => {
        const failedAt = new Date(Date.parse(start) + index * 60_000).toISOString();
        state = recordHealthCheckFailure(state, failedAt, () => 0.5);
        assert.equal(Date.parse(state.nextCheckAt ?? "") - Date.parse(failedAt), minutes * 60_000);
        assert.equal(state.consecutiveFailures, index + 1);
        assert.equal(state.autoPollingSuspended, false);
        assert.equal(state.health, index >= 2 ? SourceHealth.Degraded : SourceHealth.Healthy);
      });
    });

    describe("Access Path Fallback", () => {
      it("uses preferred healthy, then healthy alternate, then local file, then asks the user", () => {
        const preferred = createWebAccessPath({
          workId: "work-fallback" as WorkId,
          url: "https://preferred.example/series",
          label: "Preferred",
          provider: "preferred",
          health: SourceHealth.Degraded,
          isPreferred: true,
        });
        const healthy = createFeedAccessPath({
          workId: preferred.workId,
          feedUrl: "https://feed.example/series.xml",
          label: "Alternate feed",
          provider: "feed",
          health: SourceHealth.Healthy,
        });
        const local = createLocalFileAccessPath({
          workId: preferred.workId,
          filePath: "local://book.epub",
          label: "Local book",
          health: SourceHealth.Local,
        });

        assert.equal(
          selectFallbackAccessPath([preferred, healthy, local], preferred.id)?.id,
          healthy.id,
        );
        assert.equal(selectFallbackAccessPath([preferred, local], preferred.id)?.id, local.id);
        assert.equal(selectFallbackAccessPath([preferred], preferred.id), null);

        const healthyPreferred = applyAccessPathPatch(preferred, {
          health: SourceHealth.Healthy,
        });
        assert.equal(
          selectFallbackAccessPath([healthyPreferred, healthy, local], preferred.id)?.id,
          preferred.id,
        );
      });
    });

    it("bounds jitter to ±20% and allows deterministic random injection", () => {
      const initial = createHealthMonitorState();
      const at = "2026-10-05T00:00:00.000Z";
      const earliest = recordHealthCheckFailure(initial, at, () => 0);
      const latest = recordHealthCheckFailure(initial, at, () => 1);
      const midpoint = recordHealthCheckFailure(initial, at, () => 0.5);

      assert.equal(Date.parse(earliest.nextCheckAt ?? "") - Date.parse(at), 12 * 60_000);
      assert.equal(Date.parse(latest.nextCheckAt ?? "") - Date.parse(at), 18 * 60_000);
      assert.equal(Date.parse(midpoint.nextCheckAt ?? "") - Date.parse(at), 15 * 60_000);
      assert.deepEqual(
        recordHealthCheckFailure(initial, at, () => 0.25),
        recordHealthCheckFailure(initial, at, () => 0.25),
      );
    });

    it("resets failures and re-enables a suspended monitor after success", () => {
      let state = createHealthMonitorState();
      for (let failure = 0; failure < 5; failure += 1) {
        const failedAt = new Date(Date.parse(start) + failure * 60_000).toISOString();
        state = recordHealthCheckFailure(state, failedAt, () => 0.5);
      }

      const checkedAt = "2026-10-05T01:00:00.000Z";
      const recovered = recordHealthCheckSuccess(state, checkedAt);
      assert.equal(recovered.health, SourceHealth.Healthy);
      assert.equal(recovered.consecutiveFailures, 0);
      assert.equal(recovered.lastCheckedAt, checkedAt);
      assert.equal(recovered.lastSuccessfulAt, checkedAt);
      assert.equal(recovered.nextCheckAt, null);
      assert.equal(recovered.autoPollingSuspended, false);
    });

    it("suspends automatic polling at the fifth consecutive failure", () => {
      let state = createHealthMonitorState();
      let randomCalls = 0;
      for (let failure = 0; failure < 5; failure += 1) {
        const failedAt = new Date(Date.parse(start) + failure * 60_000).toISOString();
        state = recordHealthCheckFailure(state, failedAt, () => {
          randomCalls += 1;
          return 0.5;
        });
      }

      assert.equal(state.health, SourceHealth.Broken);
      assert.equal(state.consecutiveFailures, 5);
      assert.equal(state.autoPollingSuspended, true);
      assert.equal(state.nextCheckAt, null);
      assert.equal(randomCalls, 5);
    });

    it("health monitor state can be serialized and persisted", () => {
      const state = createHealthMonitorState(SourceHealth.Healthy);
      const failedAt = "2026-10-05T00:30:00.000Z";
      const afterFailure = recordHealthCheckFailure(state, failedAt, () => 0.5);

      // Verify all fields are serializable
      const serialized = JSON.stringify(afterFailure);
      assert.ok(serialized);

      // Verify it can be deserialized back
      const deserialized = JSON.parse(serialized) as HealthMonitorState;
      assert.equal(deserialized.health, afterFailure.health);
      assert.equal(deserialized.consecutiveFailures, afterFailure.consecutiveFailures);
      assert.equal(deserialized.lastCheckedAt, afterFailure.lastCheckedAt);
      assert.equal(deserialized.nextCheckAt, afterFailure.nextCheckAt);
      assert.equal(deserialized.autoPollingSuspended, afterFailure.autoPollingSuspended);
    });

    it("carries validators across 304 responses and replaces them for fresh content", () => {
      const validators = {
        etag: '"v1"',
        lastModified: "Mon, 05 Oct 2026 00:00:00 GMT",
      };
      assert.deepEqual(createConditionalRequestHeaders(validators), {
        "If-None-Match": '"v1"',
        "If-Modified-Since": "Mon, 05 Oct 2026 00:00:00 GMT",
      });
      assert.deepEqual(carryForwardConditionalValidators(validators, { status: 304 }), validators);
      assert.deepEqual(
        carryForwardConditionalValidators(validators, {
          status: 200,
          etag: '"v2"',
        }),
        { etag: '"v2"', lastModified: null },
      );
    });

    it("applies the configured stale validity window and preserves entry labels", () => {
      const entry = createUpdateEntry({
        label: "Chapter 5",
        certainty: UpdateCertainty.Confirmed,
        detectedAt: start,
      });
      const beforeExpiry = applyUpdateCertaintyValidity(
        entry,
        "2026-10-05T00:59:59.999Z",
        60 * 60_000,
      );
      const expired = applyUpdateCertaintyValidity(
        entry,
        "2026-10-05T01:00:00.000Z",
        60 * 60_000,
      );

      assert.equal(beforeExpiry.certainty, UpdateCertainty.Confirmed);
      assert.equal(expired.certainty, UpdateCertainty.Stale);
      assert.equal(expired.label, entry.label);
    });

    it("rejects invalid timestamps and invalid policy values", () => {
      assert.throws(
        () => recordHealthCheckFailure(createHealthMonitorState(), "2026-02-30T00:00:00Z"),
        /valid ISO 8601 timestamp/,
      );
      assert.throws(
        () => recordHealthCheckSuccess(createHealthMonitorState(), "not-a-date"),
        /valid ISO 8601 timestamp/,
      );
      assert.throws(
        () => recordHealthCheckFailure(createHealthMonitorState(), start, () => 1.1),
        /between 0 and 1/,
      );
      const entry = createUpdateEntry({
        label: "Chapter 5",
        certainty: UpdateCertainty.Confirmed,
        detectedAt: start,
      });
      assert.throws(
        () => applyUpdateCertaintyValidity(entry, "2026-02-30T00:00:00Z", 1_000),
        /valid ISO 8601 timestamp/,
      );
      assert.throws(
        () => applyUpdateCertaintyValidity(entry, start, Number.NaN),
        /non-negative finite number/,
      );
    });
  });
});
