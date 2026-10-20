/**
 * Writes an import plan into the client repository. Only the planned (non-duplicate)
 * candidates are written. Backup restores map old IDs to newly generated IDs so
 * memories, relations, and personal lists stay attached to the correct works.
 */

import {
  AccessCapability,
  ContentOrigin,
  ContentType,
  MemoryType,
  PersonalState,
  PrivacyState,
  PublicationState,
  SourceHealth,
  SpoilerLevel,
  WorkRelationType,
  createWebAccessPath,
  type Work,
  type WorkId,
} from "@grimoire/domain";
import { ClientRepository, clientRepository } from "../client-repository";
import { useLibraryStore } from "../stores/use-library-store";
import { useListsStore } from "../stores/use-lists-store";
import { useRadarStore } from "../stores/use-radar-store";
import { useNotebookStore } from "../stores/use-notebook-store";
import { useFandomLinksStore } from "../stores/use-fandom-links-store";
import type { BackupSnapshot, BackupWork, CandidateWork } from "./transfer";
import { normalizeTitle, safeHttpUrl } from "./transfer";

export interface ApplyResult {
  readonly worksCreated: number;
  readonly accessPathsCreated: number;
  readonly memoriesCreated: number;
  readonly relationsCreated: number;
  readonly listsRestored: number;
}

export interface ApplyImportOptions {
  readonly repository?: ClientRepository;
  readonly restoreLists?: boolean;
}

function isEnumValue<T extends string>(
  enumObj: Record<string, T>,
  value: string,
): value is T {
  return (Object.values(enumObj) as string[]).includes(value);
}

function oneOf<T extends string>(
  enumValues: Record<string, T>,
  value: string | null | undefined,
  fallback: T,
): T {
  return value && isEnumValue(enumValues, value) ? value : fallback;
}

/** Web access path for an imported URL, built by the domain factory so invariants apply. */
function webAccessPathFor(
  workId: WorkId,
  url: string,
  label: string,
  isPreferred: boolean,
) {
  return createWebAccessPath({
    workId,
    url,
    label,
    provider: "import",
    isPreferred,
    health: SourceHealth.Unknown,
    capabilities: [AccessCapability.Read],
    provenance: null,
    lastOpenedAt: null,
  });
}

function workParamsFor(input: {
  title: string;
  description: string | null;
  contentType: string | null;
  genres: readonly string[];
  tags: readonly string[];
  privacyState: "public" | "private" | "vault";
  aliases?: readonly string[];
  origin?: string;
  publicationState?: string;
  coverRef?: string | null;
}): Omit<Work, "id" | "createdAt" | "updatedAt" | "deletedAt"> {
  return {
    title: input.title,
    alternativeTitles: [],
    aliases: [...(input.aliases ?? [])],
    description: input.description,
    contentType: oneOf(ContentType, input.contentType, ContentType.WebNovel),
    origin: oneOf(ContentOrigin, input.origin ?? null, ContentOrigin.Unknown),
    publicationState: oneOf(
      PublicationState,
      input.publicationState ?? null,
      PublicationState.Unknown,
    ),
    privacyState:
      input.privacyState === "vault"
        ? PrivacyState.Vault
        : input.privacyState === "private"
          ? PrivacyState.Private
          : PrivacyState.Public,
    coverRef: input.coverRef ?? null,
    externalIds: [],
    genres: [...input.genres],
    tags: [...input.tags],
    mergedIntoWorkId: null,
  };
}

/** Writes CSV or bookmark candidates (works plus an optional access URL). */
export function applyCandidateImport(
  candidates: readonly CandidateWork[],
  options?: ApplyImportOptions,
): number {
  const repo = options?.repository ?? clientRepository;
  let created = 0;
  for (const candidate of candidates) {
    const url = candidate.accessUrl ? safeHttpUrl(candidate.accessUrl) : null;
    const item = repo.createWork(
      workParamsFor({
        title: candidate.title,
        description: candidate.description,
        contentType: candidate.contentType,
        genres: candidate.genres,
        tags: candidate.tags,
        privacyState: candidate.privacyState,
      }),
      PersonalState.Reading,
    );
    if (url) {
      repo.addAccessPath(
        item.work.id,
        webAccessPathFor(item.work.id, url, new URL(url).host, true),
      );
    }
    created++;
  }
  if (repo === clientRepository && created > 0) {
    useLibraryStore.getState().refresh();
  }
  return created;
}

/** Restores the works, access paths, memories, relations, and personal lists of a validated backup. */
export function applyBackupImport(
  snapshot: BackupSnapshot,
  plannedWorkIds: ReadonlySet<string>,
  options?: ApplyImportOptions,
): ApplyResult {
  const repo = options?.repository ?? clientRepository;
  const shouldRestoreLists = options?.restoreLists !== false;
  const idMap = new Map<string, WorkId>();
  const allWorkMap = new Map<string, WorkId>();

  const existingByNormalizedTitle = new Map<string, WorkId>();
  const existingById = new Map<string, WorkId>();
  for (const existing of repo.getItems()) {
    existingById.set(existing.work.id, existing.work.id);
    existingByNormalizedTitle.set(
      normalizeTitle(existing.work.title),
      existing.work.id,
    );
  }

  let accessPathsCreated = 0;
  let memoriesCreated = 0;
  let relationsCreated = 0;
  let worksCreated = 0;
  let listsRestored = 0;

  for (const work of snapshot.works) {
    if (!plannedWorkIds.has(work.id)) {
      const matchedId =
        existingById.get(work.id) ??
        existingByNormalizedTitle.get(normalizeTitle(work.title));
      if (matchedId) {
        allWorkMap.set(work.id, matchedId);
      }
      continue;
    }
    const restored = restoreWork(repo, work);
    idMap.set(work.id, restored.id);
    allWorkMap.set(work.id, restored.id);
    worksCreated++;
    for (const path of work.accessPaths) {
      const safe = path.url ? safeHttpUrl(path.url) : null;
      if (!safe) continue;
      repo.addAccessPath(
        restored.id,
        webAccessPathFor(
          restored.id,
          safe,
          path.label ?? new URL(safe).host,
          path.isPreferred,
        ),
      );
      accessPathsCreated++;
    }
  }

  for (const memory of snapshot.memories) {
    const workId = idMap.get(memory.workId);
    if (!workId) continue;
    try {
      const isVault = memory.privacyState === "vault";
      // If repo does not support unencrypted vault memories, store as Private
      const privacy = isVault
        ? PrivacyState.Private
        : memory.privacyState === "private"
          ? PrivacyState.Private
          : PrivacyState.Public;

      repo.addMemory(workId, {
        type: oneOf(MemoryType, memory.type, MemoryType.Note),
        title: memory.title,
        body: memory.body,
        privacyState: privacy,
        spoilerLevel: oneOf(
          SpoilerLevel,
          memory.spoilerLevel,
          SpoilerLevel.SpoilerFree,
        ),
        showInGlobalGallery: (memory as any).showInGlobalGallery ?? true,
        accessPathId: null,
        progressAnchor: null,
        tags: [...memory.tags],
      });
      memoriesCreated++;
    } catch {
      // Continue importing remaining memories if one fails
    }
  }

  for (const relation of snapshot.relations) {
    const source = idMap.get(relation.sourceWorkId);
    const target = idMap.get(relation.targetWorkId);
    if (!source || !target) continue;
    repo.linkWorkRelation(
      source,
      target,
      oneOf(
        WorkRelationType,
        relation.relationType,
        WorkRelationType.Sequel,
      ),
    );
    relationsCreated++;
  }

  if (shouldRestoreLists && snapshot.lists.length > 0) {
    const listsStore = useListsStore.getState();
    for (const backupList of snapshot.lists) {
      if (backupList.privacyState === "vault") continue;
      const targetTitleKey = normalizeTitle(backupList.title);
      let targetList = useListsStore
        .getState()
        .myLists.find((l) => normalizeTitle(l.title) === targetTitleKey);

      if (!targetList) {
        targetList = listsStore.createList({
          title: backupList.title,
          description: backupList.description ?? undefined,
          privacyState:
            backupList.privacyState === "private"
              ? PrivacyState.Private
              : PrivacyState.Public,
        });
      }

      const sortedItems = [...backupList.items].sort(
        (a, b) => a.position - b.position,
      );
      for (const item of sortedItems) {
        const mappedWorkId =
          allWorkMap.get(item.workId) ?? existingById.get(item.workId);
        if (!mappedWorkId) continue;
        if (!useListsStore.getState().isWorkInList(targetList.id, mappedWorkId)) {
          listsStore.addWorkToList(
            targetList.id,
            mappedWorkId,
            item.personalNote ?? undefined,
          );
        }
      }
      listsRestored++;
    }
  }

  // Restore and map Custom Categories
  const rawCategories = (snapshot as any).categories;
  if (Array.isArray(rawCategories) && rawCategories.length > 0 && typeof window !== "undefined") {
    try {
      const rawStored = window.localStorage.getItem("cv:custom_categories:v1");
      const existingCategories: any[] = rawStored ? JSON.parse(rawStored) : [];
      const existingIds = new Set(existingCategories.map((c) => c.id));
      const newCats = rawCategories
        .filter((c: any) => c && c.id && !existingIds.has(c.id))
        .map((c: any) => ({
          ...c,
          workIds: Array.isArray(c.workIds)
            ? c.workIds.map((oldId: string) => allWorkMap.get(oldId) ?? oldId)
            : [],
        }));
      if (newCats.length > 0) {
        window.localStorage.setItem("cv:custom_categories:v1", JSON.stringify([...existingCategories, ...newCats]));
      }
    } catch {}
  }

  // Restore Reading Relationships & Progress Anchors
  const rawRelationships = (snapshot as any).relationships;
  if (Array.isArray(rawRelationships) && rawRelationships.length > 0) {
    for (const rel of rawRelationships) {
      const mappedWorkId = idMap.get(rel.workId) ?? rel.workId;
      if (!mappedWorkId) continue;
      try {
        repo.updateRelationship(mappedWorkId as WorkId, rel);
      } catch {}
    }
  }

  // Restore Radar Captures
  const rawRadar = (snapshot as any).radarCaptures;
  if (Array.isArray(rawRadar) && rawRadar.length > 0 && typeof window !== "undefined") {
    try {
      const now = new Date().toISOString();
      useRadarStore.getState().importBatch({
        format: "grimoire-radar",
        version: 1,
        batchId: `import-${Date.now()}`,
        batchLabel: "Archive Import",
        browserSource: "unknown",
        capturedAt: now,
        items: rawRadar.map((r: any) => ({
          id: r.id || `radar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: r.url,
          normalizedUrl: r.url.toLowerCase(),
          title: r.title,
          browserSource: r.browserSource || "chromium",
          capturedAt: r.capturedAt || now,
          batchId: `import-${Date.now()}`,
          batchLabel: "Archive Import",
          state: r.state || "pending",
          snippet: r.snippet || "",
        })),
      });
    } catch {}
  }

  // Restore and activate Notebook Entries
  const rawNotebook =
    (snapshot as any).notebook_entries ?? (snapshot as any).notebookEntries;
  if (Array.isArray(rawNotebook) && rawNotebook.length > 0) {
    try {
      const notebookStore = useNotebookStore.getState();
      const activatedSet = new Set<string>();

      for (const entry of rawNotebook) {
        if (!entry || !entry.workId) continue;
        const mappedWorkId = (
          allWorkMap.get(entry.workId) ??
          existingById.get(entry.workId) ??
          entry.workId
        ) as WorkId;
        if (!mappedWorkId) continue;

        if (!activatedSet.has(mappedWorkId)) {
          notebookStore.activateNotebook(mappedWorkId);
          activatedSet.add(mappedWorkId);
        }

        const validCategories = [
          "theory",
          "clue",
          "character",
          "question",
          "scratch",
        ] as const;
        const category = validCategories.includes(entry.category)
          ? entry.category
          : "scratch";

        notebookStore.addEntry({
          workId: mappedWorkId,
          category,
          title: entry.title || "Untitled Note",
          body: entry.body || "",
          chapterHint: entry.chapterHint ?? null,
          pinned: Boolean(entry.pinned),
        });
      }
    } catch {}
  }

  // Restore Fandom Links
  const rawFandom =
    (snapshot as any).fandom_links ?? (snapshot as any).fandomLinks;
  if (Array.isArray(rawFandom) && rawFandom.length > 0) {
    try {
      const fandomStore = useFandomLinksStore.getState();
      for (const link of rawFandom) {
        if (!link || !link.workId || !link.url) continue;
        const mappedWorkId = (
          allWorkMap.get(link.workId) ??
          existingById.get(link.workId) ??
          link.workId
        ) as WorkId;
        if (!mappedWorkId) continue;

        try {
          fandomStore.addFandomLink({
            workId: mappedWorkId,
            communityName:
              link.communityName || link.name || "Community Wiki",
            provider: link.provider,
            canonicalTitle: link.canonicalTitle || link.communityName,
            url: link.url,
            language: link.language || "en",
            isPreferred: Boolean(link.isPreferred),
            provenance: link.provenance || "import",
          });
        } catch {}
      }
    } catch {}
  }

  if (repo === clientRepository && worksCreated > 0) {
    useLibraryStore.getState().refresh();
  }

  return {
    worksCreated,
    accessPathsCreated,
    memoriesCreated,
    relationsCreated,
    listsRestored,
  };
}

function restoreWork(repo: ClientRepository, work: BackupWork): Work {
  return repo.createWork(
    workParamsFor({
      title: work.title,
      description: work.description,
      contentType: work.contentType,
      genres: work.genres,
      tags: work.tags,
      privacyState:
        work.privacyState === "vault"
          ? "vault"
          : work.privacyState === "private"
            ? "private"
            : "public",
      aliases: work.aliases,
      origin: work.origin,
      publicationState: work.publicationState,
      coverRef:
        work.coverRef && safeHttpUrl(work.coverRef) ? work.coverRef : null,
    }),
    PersonalState.Reading,
  ).work;
}
