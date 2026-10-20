import * as React from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import {
  MemoryType,
  PrivacyState,
  ProgressAnchor,
  SpoilerLevel,
  MemoryAssetType,
  formatProgressAnchor,
} from "@grimoire/domain";
import { MemoryAssetId, MemoryId, newId } from "@grimoire/shared";
import { clientRepository } from "@grimoire/state";
import { useVaultStore } from "@grimoire/vault";
import { getMemoryAssetBlob, storeMemoryImage } from "@grimoire/reader";
import {
  Button,
  EmptyState,
  MemoryCard,
  PageContainer,
  SearchInput,
  toast,
} from "@grimoire/ui";
import { toUIMemoryType } from "../utils/display-adapters";

export interface MemoryProps {
  onNavigateWork?: (workId: string) => void;
}

const MEMORY_TYPES = [
  MemoryType.PersonalNote,
  MemoryType.Diary,
  MemoryType.Quote,
  MemoryType.WhySaved,
  MemoryType.WhyStopped,
  MemoryType.LoreEntry,
  MemoryType.FavoritePanel,
  MemoryType.Screenshot,
] as const;
const FILTER_TYPES = Object.values(MemoryType);

function anchorLabel(anchor: ProgressAnchor | null): string | undefined {
  return anchor ? formatProgressAnchor(anchor) : undefined;
}

export function Memory({ onNavigateWork }: MemoryProps) {
  const [revision, setRevision] = React.useState(0);
  const [filterType, setFilterType] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [showHidden, setShowHidden] = React.useState(false);
  const [showSpoilers, setShowSpoilers] = React.useState(false);
  const [showCapture, setShowCapture] = React.useState(false);
  const [workId, setWorkId] = React.useState("");
  const [type, setType] = React.useState<MemoryType>(MemoryType.PersonalNote);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [spoilerLevel, setSpoilerLevel] = React.useState<SpoilerLevel>(SpoilerLevel.SpoilerFree);
  const [loreCategory, setLoreCategory] = React.useState("character");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = React.useState<
    Record<string, { readonly thumbnail: string }>
  >({});
  const galleryRef = React.useRef<HTMLDivElement>(null);
  const loadedImagesRef = React.useRef(new Set<string>());
  const objectUrlsRef = React.useRef<string[]>([]);
  const [viewport, setViewport] = React.useState({ top: 0, height: 0, width: 0 });

  const works = clientRepository.getItems().filter((item) => !item.work.deletedAt);
  const isVaultUnlocked = useVaultStore((state) => state.status === "unlocked");
  const memories = React.useMemo(() => clientRepository.listMemories(), [revision]);

  const handleDeleteMemory = (memoryId: MemoryId) => {
    if (typeof window !== "undefined" && !window.confirm("Permanently delete this memory? This cannot be undone.")) {
      return;
    }
    clientRepository.deleteMemory(memoryId);
    setRevision((v) => v + 1);
    toast({
      title: "Memory deleted",
      description: "Note and associated captures removed.",
    });
  };

  const handleFlushFilteredMemories = () => {
    if (filteredMemories.length === 0) return;
    if (typeof window !== "undefined" && !window.confirm(`Permanently flush all ${filteredMemories.length} visible memories? This cannot be undone.`)) {
      return;
    }
    for (const item of filteredMemories) {
      clientRepository.deleteMemory(item.memory.id as MemoryId);
    }
    setRevision((v) => v + 1);
    toast({
      title: "Memories flushed",
      description: `Removed ${filteredMemories.length} memories.`,
    });
  };

  React.useEffect(
    () => () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    },
    [],
  );

  React.useEffect(() => {
    const updateViewport = () =>
      setViewport({
        top: window.scrollY,
        height: window.innerHeight,
        width: window.innerWidth,
      });
    updateViewport();
    let scheduledFrame = 0;
    const scheduleUpdate = () => {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(() => {
        scheduledFrame = 0;
        updateViewport();
      });
    };
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (scheduledFrame) window.cancelAnimationFrame(scheduledFrame);
    };
  }, []);
  const filteredMemories = memories.filter(({ memory, workTitle }) => {
    if (memory.privacyState === PrivacyState.Vault && !isVaultUnlocked) return false;
    if (!showHidden && !memory.showInGlobalGallery) return false;
    const isSpoiler =
      (memory.spoilerLevel as string) === SpoilerLevel.Minor ||
      (memory.spoilerLevel as string) === SpoilerLevel.Major ||
      (memory.spoilerLevel as string) === SpoilerLevel.Mild ||
      (memory.spoilerLevel as string) === "minor" ||
      (memory.spoilerLevel as string) === "major" ||
      (memory.spoilerLevel as string) === "mild";
    if (!showSpoilers && isSpoiler) return false;
    if (filterType !== "all" && memory.type !== filterType) return false;
    const query = search.trim().toLocaleLowerCase();
    if (!query) return true;
    return [memory.title, memory.body, workTitle, anchorLabel(memory.progressAnchor)]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
  const columns = viewport.width >= 1024 ? 3 : viewport.width >= 640 ? 2 : 1;
  const rowStep = 520;
  const totalRows = Math.ceil(filteredMemories.length / columns);
  const galleryTop =
    (galleryRef.current?.getBoundingClientRect().top ?? 0) +
    (typeof window === "undefined" ? 0 : window.scrollY);
  const localScrollTop = Math.max(0, viewport.top - galleryTop);
  const firstRow = Math.min(totalRows, Math.max(0, Math.floor(localScrollTop / rowStep) - 1));
  const lastRow = Math.min(totalRows, Math.ceil((localScrollTop + viewport.height) / rowStep) + 1);
  const visibleMemories = filteredMemories.slice(firstRow * columns, lastRow * columns);

  React.useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const load = async (memoryId: string) => {
      if (loadedImagesRef.current.has(memoryId)) return;
      loadedImagesRef.current.add(memoryId);
      const memory = memories.find((entry) => entry.memory.id === memoryId)?.memory;
      if (!memory || memory.assets.length === 0) return;
      try {
        const asset = memory.assets[0];
        if (!asset) return;
        const ref = asset.thumbnailRef || asset.fileId;
        if (
          ref &&
          (ref.startsWith("data:") ||
            ref.startsWith("http://") ||
            ref.startsWith("https://") ||
            ref.startsWith("blob:"))
        ) {
          setImagePreviews((current) => ({
            ...current,
            [memoryId]: { thumbnail: ref },
          }));
          return;
        }

        const thumbnailBlob = asset.thumbnailRef
          ? await getMemoryAssetBlob(asset.thumbnailRef)
          : await getMemoryAssetBlob(asset.fileId);
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
        objectUrlsRef.current.push(thumbnailUrl);
        setImagePreviews((current) => ({
          ...current,
          [memoryId]: { thumbnail: thumbnailUrl },
        }));
      } catch (loadError) {
        // Fallback: If local IndexedDB asset isn't found, do not crash or spam toasts
        console.warn(`Memory asset not found in local IndexedDB for ${memoryId}`);
      }
    };
    const cards = Array.from(gallery.querySelectorAll<HTMLElement>("[data-memory-id]"));
    if (typeof IntersectionObserver === "undefined") {
      for (const card of cards) void load(card.dataset.memoryId ?? "");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const card = entry.target as HTMLElement;
          observer.unobserve(card);
          void load(card.dataset.memoryId ?? "");
        }
      },
      { rootMargin: "200px" },
    );
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, [revision, visibleMemories]);

  const capture = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workId) {
      toast({ title: "Choose a work for this memory", variant: "destructive" });
      return;
    }
    if (!title.trim() && !body.trim() && !imageFile) {
      toast({ title: "Enter a title or note", variant: "destructive" });
      return;
    }
    if ((type === MemoryType.FavoritePanel || type === MemoryType.Screenshot) && !imageFile) {
      toast({ title: "Choose an image for this memory", variant: "destructive" });
      return;
    }
    const item = clientRepository.getItems().find((candidate) => candidate.work.id === workId);
    if (!item) {
      toast({ title: "Selected work is no longer available", variant: "destructive" });
      return;
    }
    if (type === MemoryType.Quote && !item.relationship?.currentAnchor) {
      toast({
        title: "Add a progress anchor before capturing a quote",
        description: "Quotes are saved with the selected Work's current reading position.",
        variant: "destructive",
      });
      return;
    }
    const accessPathId =
      item.relationship?.preferredAccessPathId ??
      item.accessPaths.find((path) => path.isPreferred)?.id ??
      item.accessPaths[0]?.id ??
      null;
    try {
      const storedImage = imageFile ? await storeMemoryImage(imageFile) : null;
      clientRepository.addMemory(item.work.id, {
        type,
        title: title.trim() || null,
        body: body.trim() || null,
        privacyState: PrivacyState.Private,
        spoilerLevel,
        showInGlobalGallery: true,
        accessPathId,
        progressAnchor: item.relationship?.currentAnchor ?? null,
        assets: storedImage
          ? [
              {
                id: newId() as MemoryAssetId,
                assetType: MemoryAssetType.Image,
                fileId: storedImage.fileId,
                thumbnailRef: storedImage.thumbnailId,
                width: storedImage.width,
                height: storedImage.height,
                createdAt: storedImage.createdAt,
              },
            ]
          : [],
        tags: type === MemoryType.LoreEntry ? [loreCategory] : [],
      });
      setTitle("");
      setBody("");
      setImageFile(null);
      setShowCapture(false);
      setRevision((value) => value + 1);
      toast({ title: "Memory saved with work and reading context" });
    } catch (captureError) {
      toast({
        title: "Memory could not be saved",
        description: captureError instanceof Error ? captureError.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-[var(--gm-accent-strong)]" />
            <h1 className="text-gm-2xl font-extrabold tracking-tight text-[var(--gm-text)] sm:text-gm-3xl">
              Memory
            </h1>
          </div>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
            Your notes, quotes, and reflections, linked to their work and reading position.
          </p>
        </div>
        <Button
          variant="default"
          className="gap-2"
          onClick={() => setShowCapture((value) => !value)}
        >
          <Plus className="h-4 w-4" />
          Capture Memory
        </Button>
      </div>

      {showCapture && (
        <form
          onSubmit={(event) => void capture(event)}
          className="mb-6 grid gap-3 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 sm:grid-cols-2"
        >
          <label className="grid gap-1 text-gm-xs text-[var(--gm-text-muted)]">
            Work
            <select
              required
              value={workId}
              onChange={(event) => setWorkId(event.target.value)}
              className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
            >
              <option value="">Choose a work</option>
              {works.map((item) => (
                <option key={item.work.id} value={item.work.id}>
                  {item.work.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-gm-xs text-[var(--gm-text-muted)] sm:col-span-2">
            Image (optional, up to 10 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
            />
          </label>
          <label className="grid gap-1 text-gm-xs text-[var(--gm-text-muted)]">
            Memory type
            <select
              value={type}
              onChange={(event) => setType(event.target.value as MemoryType)}
              className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
            >
              {MEMORY_TYPES.map((memoryType) => (
                <option key={memoryType} value={memoryType}>
                  {memoryType.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-gm-xs text-[var(--gm-text-muted)] sm:col-span-2">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
            />
          </label>
          <label className="grid gap-1 text-gm-xs text-[var(--gm-text-muted)] sm:col-span-2">
            Note
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={10000}
              rows={4}
              className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
            />
          </label>
          <label className="grid gap-1 text-gm-xs text-[var(--gm-text-muted)]">
            Spoiler level
            <select
              value={spoilerLevel}
              onChange={(event) => setSpoilerLevel(event.target.value as SpoilerLevel)}
              className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
            >
              {Object.values(SpoilerLevel).map((level) => (
                <option key={level} value={level}>
                  {level.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          {type === MemoryType.LoreEntry && (
            <label className="grid gap-1 text-gm-xs text-[var(--gm-text-muted)]">
              Lore category
              <select
                value={loreCategory}
                onChange={(event) => setLoreCategory(event.target.value)}
                className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
              >
                <option value="character">Character</option>
                <option value="faction">Faction</option>
                <option value="terminology">Terminology</option>
              </select>
            </label>
          )}
          <div className="flex items-end gap-2">
            <Button type="submit">Save memory</Button>
            <Button type="button" variant="outline" onClick={() => setShowCapture(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {["all", ...FILTER_TYPES].map((memoryType) => (
            <button
              key={memoryType}
              type="button"
              onClick={() => setFilterType(memoryType)}
              className={`rounded-gm-full px-3 py-1 text-gm-xs font-medium capitalize ${
                filterType === memoryType
                  ? "bg-[var(--gm-accent)] text-white"
                  : "bg-[var(--gm-surface)] text-[var(--gm-text-muted)]"
              }`}
            >
              {memoryType === "all" ? "All" : memoryType.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <SearchInput
            placeholder="Search memories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-gm-xs text-[var(--gm-text-muted)]">
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(event) => setShowHidden(event.target.checked)}
            />
            Include hidden from gallery
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSpoilers}
              onChange={(event) => setShowSpoilers(event.target.checked)}
            />
            Show spoiler memories
          </label>
        </div>
        {filteredMemories.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
            onClick={handleFlushFilteredMemories}
            title="Flush visible memories"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Flush Filtered ({filteredMemories.length})</span>
          </Button>
        )}
      </div>

      {filteredMemories.length === 0 ? (
        <EmptyState
          variant="memory"
          actionLabel="Capture First Memory"
          onAction={() => setShowCapture(true)}
        />
      ) : (
        <div ref={galleryRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {firstRow > 0 && (
            <div
              aria-hidden="true"
              className="col-span-full"
              style={{ height: firstRow * rowStep - 16 }}
            />
          )}
          {visibleMemories.map(({ memory, workTitle }) => (
            <article
              key={`${revision}-${memory.id}`}
              className="flex h-[504px] flex-col gap-2 overflow-hidden"
              data-memory-id={memory.assets.length > 0 ? memory.id : undefined}
              aria-label={`Memory for ${workTitle ?? "unlinked work"}`}
            >
              <MemoryCard
                type={toUIMemoryType(memory.type)}
                content={memory.body ?? memory.title ?? ""}
                workTitle={workTitle ?? undefined}
                workId={memory.workId ?? undefined}
                anchorLabel={anchorLabel(memory.progressAnchor)}
                createdAt={memory.createdAt}
                onNavigateWork={(id) => {
                  if (id) onNavigateWork?.(id);
                }}
              />
              {memory.assets.slice(0, 1).map((asset) => {
                const preview = imagePreviews[memory.id];
                if (!preview) return null;
                return (
                  <div
                    key={asset.id}
                    className="relative max-h-64 overflow-hidden rounded-gm-lg border border-[var(--gm-border)]"
                  >
                    <img
                      src={preview.thumbnail}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-105 object-cover blur-md"
                    />
                    <img
                      src={preview.thumbnail}
                      alt={memory.title ?? `Saved image for ${workTitle ?? "memory"}`}
                      loading="lazy"
                      decoding="async"
                      className="relative max-h-64 w-full object-contain"
                    />
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--gm-border)]/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clientRepository.updateMemory(memory.id, {
                      showInGlobalGallery: !memory.showInGlobalGallery,
                    });
                    setRevision((value) => value + 1);
                  }}
                >
                  {memory.showInGlobalGallery ? "Hide from gallery" : "Show in gallery"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--gm-text-muted)] hover:text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)] p-2"
                  title="Delete memory"
                  onClick={() => handleDeleteMemory(memory.id as MemoryId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
          {lastRow < totalRows && (
            <div
              aria-hidden="true"
              className="col-span-full"
              style={{ height: Math.max(0, (totalRows - lastRow) * rowStep - 16) }}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}
