import { describe, expect, it, beforeEach } from "vitest";
import { MemoryType, PrivacyState, SpoilerLevel, ContentType, PersonalState } from "@grimoire/domain";
import type { WorkId } from "@grimoire/shared";
import {
  clientRepository,
  generateLocalRecommendations,
  useFandomLinksStore,
  useNotebookStore,
  useRecommendationsStore,
} from "../src";

describe("Notebook, Fandom Links & Local Explainable Recommendations", () => {
  beforeEach(() => {
    if (!clientRepository.getItem("work-orv" as WorkId)) {
      const item = clientRepository.createWork(
        {
          title: "Omniscient Reader's Viewpoint",
          contentType: ContentType.Novel,
          originCountry: "KR",
          isFavorite: true,
          isArchived: false,
          tags: ["apocalypse", "progression"],
          genres: ["Action", "Fantasy"],
        },
        PersonalState.Reading,
      );
      (item.work as any).id = "work-orv";
      (clientRepository as any).items.delete(item.work.id);
      (clientRepository as any).items.set("work-orv", item);
    }
    if (!clientRepository.getItem("work-frieren" as WorkId)) {
      const item = clientRepository.createWork(
        {
          title: "Frieren: Beyond Journey's End",
          contentType: ContentType.Manga,
          originCountry: "JP",
          isFavorite: false,
          isArchived: false,
          tags: ["fantasy", "magic"],
          genres: ["Adventure", "Drama"],
        },
        PersonalState.Reading,
      );
      (item.work as any).id = "work-frieren";
      (clientRepository as any).items.delete(item.work.id);
      (clientRepository as any).items.set("work-frieren", item);
    }
    if (!clientRepository.getItem("work-planned-fantasy" as WorkId)) {
      const item3 = clientRepository.createWork(
        {
          title: "The Great Mage Returns After 4000 Years",
          contentType: ContentType.Manhwa,
          originCountry: "KR",
          isFavorite: false,
          isArchived: false,
          tags: ["fantasy", "magic"],
          genres: ["Fantasy", "Action"],
        },
        PersonalState.Planned,
      );
      (item3.work as any).id = "work-planned-fantasy";
      (clientRepository as any).items.delete(item3.work.id);
      (clientRepository as any).items.set("work-planned-fantasy", item3);
    }
  });
  describe("Activatable Per-Work Notebook (BACKLOG.md §4.3)", () => {
    it("activates and deactivates per work while preserving working entries", () => {
      const workId = "work-frieren" as WorkId;
      useNotebookStore.getState().deactivateNotebook(workId);
      expect(useNotebookStore.getState().isActivated(workId)).toBe(false);

      useNotebookStore.getState().activateNotebook(workId);
      expect(useNotebookStore.getState().isActivated(workId)).toBe(true);

      const entry = useNotebookStore.getState().addEntry({
        workId,
        category: "theory",
        title: "Aureole soul communion mechanics",
        body: "Himmel's ring symbolism ties into Ende's geographic boundary.",
        chapterHint: "Ch. 118",
      });

      expect(entry.workId).toBe(workId);
      expect(entry.category).toBe("theory");
      expect(useNotebookStore.getState().getEntriesForWork(workId).some((e) => e.id === entry.id)).toBe(
        true,
      );

      // Deactivating hides the notebook without destroying entries
      useNotebookStore.getState().deactivateNotebook(workId);
      expect(useNotebookStore.getState().isActivated(workId)).toBe(false);
      expect(useNotebookStore.getState().getEntriesForWork(workId).some((e) => e.id === entry.id)).toBe(
        true,
      );

      // Clean up
      useNotebookStore.getState().deleteEntry(entry.id);
    });

    it("promotes a working Notebook entry into a curated private Memory with one click", () => {
      const workId = "work-orv" as WorkId;
      useNotebookStore.getState().activateNotebook(workId);

      const entry = useNotebookStore.getState().addEntry({
        workId,
        category: "clue",
        title: "Fourth Wall origin note",
        body: "The Fourth Wall speaks directly to Dokja as if it has its own ego.",
        chapterHint: "Ch. 120",
      });

      const promoted = useNotebookStore.getState().promoteToMemory(entry.id);
      expect(promoted).not.toBeNull();
      expect(promoted?.workId).toBe(workId);
      expect(promoted?.privacyState).toBe(PrivacyState.Private);
      expect(promoted?.showInGlobalGallery).toBe(false);
      expect(promoted?.tags).toContain("notebook-graduated");
      expect(promoted?.tags).toContain("clue");

      const updatedEntry = useNotebookStore
        .getState()
        .getEntriesForWork(workId)
        .find((e) => e.id === entry.id);
      expect(updatedEntry?.promotedMemoryId).toBe(promoted?.id);

      // Clean up
      if (promoted) {
        clientRepository.deleteMemory(promoted.id);
      }
      useNotebookStore.getState().deleteEntry(entry.id);
    });
  });

  describe("First-Class Fandom Links (BACKLOG.md §4.5)", () => {
    it("adds, prefers, and removes community links separately from reading AccessPaths", () => {
      const workId = "work-orv" as WorkId;
      const beforeAccessPaths = clientRepository.getItem(workId)?.accessPaths.length ?? 0;

      const added = useFandomLinksStore.getState().addFandomLink({
        workId,
        communityName: "r/OmniscientReader Subreddit",
        url: "https://www.reddit.com/r/OmniscientReader/",
        language: "en",
      });

      expect(added.provider).toBe("subreddit");
      expect(added.workId).toBe(workId);

      // Verify reading AccessPaths were not polluted
      const afterAccessPaths = clientRepository.getItem(workId)?.accessPaths.length ?? 0;
      expect(afterAccessPaths).toBe(beforeAccessPaths);

      useFandomLinksStore.getState().setPreferredFandomLink(workId, added.id);
      const links = useFandomLinksStore.getState().getLinksForWork(workId);
      expect(links[0]?.id).toBe(added.id);
      expect(links[0]?.isPreferred).toBe(true);

      useFandomLinksStore.getState().removeFandomLink(added.id);
      expect(
        useFandomLinksStore
          .getState()
          .getLinksForWork(workId)
          .some((l) => l.id === added.id),
      ).toBe(false);
    });

    it("rejects non-HTTP(S) URLs for fandom links", () => {
      expect(() =>
        useFandomLinksStore.getState().addFandomLink({
          workId: "work-orv" as WorkId,
          communityName: "Bad Link",
          url: "javascript:alert(1)",
        }),
      ).toThrow();
    });
  });

  describe("Local Explainable Recommendation Engine (BACKLOG.md §3.2)", () => {
    it("generates explainable recommendations with stated reasons and respects dismissals", () => {
      useRecommendationsStore.getState().restoreAllDismissed();
      const items = clientRepository.getItems();
      const recs = generateLocalRecommendations(items);

      expect(recs.length).toBeGreaterThan(0);
      for (const rec of recs) {
        expect(rec.reasonLabel.length).toBeGreaterThan(10);
        expect(rec.workId).toBeTruthy();
      }

      const firstWorkId = recs[0]!.workId;
      useRecommendationsStore.getState().dismissRecommendation(firstWorkId);
      const dismissedSet = new Set(useRecommendationsStore.getState().dismissedWorkIds);
      const filteredRecs = generateLocalRecommendations(items, dismissedSet);
      expect(filteredRecs.some((r) => r.workId === firstWorkId)).toBe(false);

      useRecommendationsStore.getState().restoreAllDismissed();
      expect(useRecommendationsStore.getState().dismissedWorkIds.length).toBe(0);
    });
  });

  describe("Memory Edit & Delete (BACKLOG.md §2.3)", () => {
    it("updates memory title/body/privacy and deletes a memory cleanly", () => {
      const workId = "work-orv" as WorkId;
      const created = clientRepository.addMemory(workId, {
        type: MemoryType.Note,
        title: "Initial Title",
        body: "Initial Body",
        privacyState: PrivacyState.Private,
        spoilerLevel: SpoilerLevel.SpoilerFree,
        showInGlobalGallery: false,
      });

      const updated = clientRepository.updateMemory(created.id, {
        title: "Edited Title",
        body: "Edited Body",
        privacyState: PrivacyState.Public,
        showInGlobalGallery: true,
      });
      expect(updated.title).toBe("Edited Title");
      expect(updated.body).toBe("Edited Body");
      expect(updated.privacyState).toBe(PrivacyState.Public);

      const deleted = clientRepository.deleteMemory(created.id);
      expect(deleted).toBe(true);
      expect(
        clientRepository
          .getItem(workId)
          ?.memories.some((m) => m.id === created.id && !m.deletedAt),
      ).toBe(false);
    });
  });
});
