import { describe, it, expect, beforeEach } from "vitest";
import { useLibraryStore } from "../src/stores/use-library-store";
import { useReturnDeskStore } from "../src/stores/use-return-desk-store";
import { useWorkDetailStore } from "../src/stores/use-work-detail-store";
import {
  ContentType,
  MemoryType,
  MemoryAssetType,
  PersonalState,
  PrivacyState,
  ProgressMethod,
  SpoilerLevel,
} from "@chronicles-vault/domain";
import type { MemoryAssetId } from "@chronicles-vault/shared";
import { clientRepository } from "../src/client-repository";

describe("State Package Stores", () => {
  beforeEach(() => {
    useLibraryStore.getState().resetFilters();
  });

  describe("useLibraryStore", () => {
    it("initializes with default state", () => {
      const state = useLibraryStore.getState();
      expect(state.viewMode).toBe("grid");
      expect(state.searchQuery).toBe("");
      expect(state.items).toBeDefined();
    });

    it("updates view mode", () => {
      useLibraryStore.getState().setViewMode("table");
      expect(useLibraryStore.getState().viewMode).toBe("table");
    });

    it("updates search query filter", () => {
      useLibraryStore.getState().setSearchQuery("Frieren");
      expect(useLibraryStore.getState().searchQuery).toBe("Frieren");
    });

    it("sets content type filter", () => {
      useLibraryStore.getState().setContentType(ContentType.Manga);
      expect(useLibraryStore.getState().contentType).toBe(ContentType.Manga);
    });

    it("creates a new work and refreshes items", () => {
      const initialCount = useLibraryStore.getState().items.length;
      const newItem = useLibraryStore.getState().createWork(
        {
          title: "Store Test Manga",
          contentType: ContentType.Manga,
          originCountry: "JP",
          isFavorite: false,
          isArchived: false,
          tags: ["test"],
          genres: ["Action"],
        },
        PersonalState.Reading,
      );

      expect(newItem).toBeDefined();
      expect(newItem.work.title).toBe("Store Test Manga");
      expect(useLibraryStore.getState().items.length).toBeGreaterThan(initialCount);
    });

    it("prevents Vault-classified works from entering public client storage", () => {
      const item = clientRepository.getItems()[0]!;
      expect(() =>
        clientRepository.updateWork(item.work.id, { privacyState: PrivacyState.Vault }),
      ).toThrow("Vault works must be encrypted");
    });

    it("records reader page progress against the linked work", () => {
      const item = clientRepository.getItems()[0]!;
      const anchor = { type: "page" as const, page: 7, totalPages: 20 };

      useLibraryStore.getState().recordProgress(item.work.id, anchor, ProgressMethod.Reader);

      const updated = clientRepository.getItem(item.work.id);
      expect(updated?.relationship?.currentAnchor).toEqual(anchor);
      expect(updated?.latestProgress?.method).toBe(ProgressMethod.Reader);
    });
  });

  describe("useReturnDeskStore", () => {
    it("manages return signals and categories", () => {
      const state = useReturnDeskStore.getState();
      expect(state.allSignals).toBeDefined();
      expect(state.continueRail).toBeDefined();
      expect(state.catchUpList).toBeDefined();
      expect(state.stalledList).toBeDefined();
      expect(state.isRefresherOpen).toBe(false);
    });

    it("opens and closes refresher drawer", () => {
      const items = clientRepository.getItems();
      if (items.length > 0) {
        const firstId = items[0]!.work.id;
        useReturnDeskStore.getState().openRefresher(firstId);
        expect(useReturnDeskStore.getState().isRefresherOpen).toBe(true);
        expect(useReturnDeskStore.getState().selectedWorkId).toBe(firstId);

        useReturnDeskStore.getState().closeRefresher();
        expect(useReturnDeskStore.getState().isRefresherOpen).toBe(false);
      }
    });
  });

  describe("useWorkDetailStore", () => {
    it("loads and clears active work", () => {
      const items = clientRepository.getItems();
      if (items.length > 0) {
        const firstId = items[0]!.work.id;
        useWorkDetailStore.getState().loadWork(firstId);
        expect(useWorkDetailStore.getState().activeWorkId).toBe(firstId);
        expect(useWorkDetailStore.getState().activeItem).toBeDefined();

        useWorkDetailStore.getState().clearWork();
        expect(useWorkDetailStore.getState().activeWorkId).toBeNull();
        expect(useWorkDetailStore.getState().activeItem).toBeNull();
      }
    });

    describe("client memory gallery", () => {
      it("lists reader-context memories and updates gallery visibility", () => {
        const item = clientRepository.getItems()[0]!;
        const accessPathId = item.accessPaths[0]?.id ?? null;
        const anchor = { type: "page" as const, page: 4, totalPages: 18 };
        const memory = clientRepository.addMemory(item.work.id, {
          type: MemoryType.PersonalNote,
          title: "Reader capture test",
          body: "Remember this scene.",
          privacyState: PrivacyState.Private,
          spoilerLevel: SpoilerLevel.Minor,
          showInGlobalGallery: true,
          accessPathId,
          progressAnchor: anchor,
          assets: [
            {
              id: "asset-gallery-test" as MemoryAssetId,
              assetType: MemoryAssetType.Image,
              fileId: "local-image-blob",
              thumbnailRef: "local-image-thumb",
              width: 320,
              height: 240,
              createdAt: new Date().toISOString(),
            },
          ],
          tags: [],
        });

        const galleryEntry = clientRepository
          .listMemories()
          .find((entry) => entry.memory.id === memory.id);
        expect(galleryEntry?.workTitle).toBe(item.work.title);
        expect(galleryEntry?.memory.accessPathId).toBe(accessPathId);
        expect(galleryEntry?.memory.progressAnchor).toEqual(anchor);
        expect(galleryEntry?.memory.assets[0]?.memoryId).toBe(memory.id);

        const hidden = clientRepository.updateMemory(memory.id, {
          showInGlobalGallery: false,
          spoilerLevel: SpoilerLevel.Major,
        });
        expect(hidden.showInGlobalGallery).toBe(false);
        expect(hidden.spoilerLevel).toBe(SpoilerLevel.Major);
        expect(clientRepository.listMemories().some((entry) => entry.memory.id === memory.id)).toBe(
          true,
        );
        expect(() =>
          clientRepository.updateMemory(memory.id, { privacyState: PrivacyState.Vault }),
        ).toThrow("Vault memories must be encrypted");
        expect(() =>
          clientRepository.updateWork(item.work.id, { privacyState: PrivacyState.Vault }),
        ).toThrow("Vault works must be encrypted");
        expect(() =>
          clientRepository.addMemory(item.work.id, {
            type: MemoryType.PersonalNote,
            title: "Private capture",
            body: "This must never enter public browser storage.",
            privacyState: PrivacyState.Vault,
            spoilerLevel: SpoilerLevel.SpoilerFree,
            showInGlobalGallery: false,
            accessPathId: null,
            progressAnchor: null,
            assets: [],
            tags: [],
          }),
        ).toThrow("Vault memories must be encrypted");
      });

      it("rejects a memory access path owned by a different work", () => {
        const items = clientRepository.getItems();
        const [first, second] = items;
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        const foreignPath = second!.accessPaths[0];
        if (!foreignPath) return;

        expect(() =>
          clientRepository.addMemory(first!.work.id, {
            type: MemoryType.PersonalNote,
            title: "Invalid source",
            body: null,
            privacyState: PrivacyState.Private,
            spoilerLevel: SpoilerLevel.SpoilerFree,
            showInGlobalGallery: true,
            accessPathId: foreignPath.id,
            progressAnchor: null,
            assets: [],
            tags: [],
          }),
        ).toThrow("must belong to its Work");
      });

      it("ensures Work survives completely intact when all AccessPaths are deleted", () => {
        const item = clientRepository.getItems()[0];
        expect(item).toBeDefined();
        const workId = item!.work.id;
        const initialMemoriesCount = item!.memories.length;

        useWorkDetailStore.getState().loadWork(workId);
        let detail = useWorkDetailStore.getState().activeItem;
        expect(detail).toBeDefined();

        // Delete all access paths one by one
        const pathIds = [...detail!.accessPaths.map((p) => p.id)];
        for (const pid of pathIds) {
          useWorkDetailStore.getState().deleteAccessPath(pid);
        }

        // Verify the Work survived in store and repository with 0 access paths
        detail = useWorkDetailStore.getState().activeItem;
        expect(detail).toBeDefined();
        expect(detail!.work.id).toBe(workId);
        expect(detail!.accessPaths.length).toBe(0);
        expect(detail!.relationship).toBeDefined();
        expect(detail!.relationship?.preferredAccessPathId).toBeNull();
        expect(detail!.memories.length).toBe(initialMemoriesCount);

        // Verify Work still exists in library
        const repoItem = clientRepository.getItem(workId);
        expect(repoItem).toBeDefined();
        expect(repoItem!.accessPaths.length).toBe(0);

        // Adding a new access path to the work succeeds normally
        const added = useWorkDetailStore.getState().addAccessPath({
          kind: 'web' as any,
          url: 'https://new-source.example.com',
          provider: 'NewSource',
          label: 'Brand New Source',
          isPreferred: true,
          health: 'healthy' as any,
          healthState: 'healthy' as any,
          capabilities: [],
          lastCheckedAt: null,
          lastOpenedAt: null,
          provenance: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        expect(added).toBeDefined();
        detail = useWorkDetailStore.getState().activeItem;
        expect(detail!.accessPaths.length).toBe(1);
        expect(detail!.relationship?.preferredAccessPathId).toBe(added!.id);
      });

      it("checks and updates access path health via checkAccessPathHealth", async () => {
        const item = clientRepository.getItems()[1];
        expect(item).toBeDefined();
        const workId = item!.work.id;
        useWorkDetailStore.getState().loadWork(workId);

        const detail = useWorkDetailStore.getState().activeItem;
        expect(detail).toBeDefined();
        const path = detail!.accessPaths[0];
        expect(path).toBeDefined();

        const newHealth = await useWorkDetailStore.getState().checkAccessPathHealth(path!.id);
        expect(newHealth).toBeDefined();

        const updatedDetail = useWorkDetailStore.getState().activeItem;
        const updatedPath = updatedDetail!.accessPaths.find((p) => p.id === path!.id);
        expect(updatedPath?.lastCheckedAt).toBeDefined();
        expect(updatedPath?.healthMonitorState).toBeDefined();
      });
    });
  });
});
