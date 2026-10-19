import * as React from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import {
  getLocalFileBlob,
  listLocalFiles,
  openCbz,
  startReaderSession,
  updateReaderSession,
  endReaderSession,
  getCbzCacheWindow,
  toCbzPageAnchor,
  toCbzPageNumber,
} from "@grimoire/reader";
import type { CbzArchive, CbzLoadedPage, LocalFileMetadata } from "@grimoire/reader";
import {
  MemoryType,
  PrivacyState,
  SpoilerLevel,
  type ProgressAnchor,
  type Work,
} from "@grimoire/domain";
import { clientRepository, useLibraryStore } from "@grimoire/state";
import { Button } from "@grimoire/ui";

const MAX_CACHED_BITMAP_BYTES = 64 * 1024 * 1024;

interface CbzReaderProps {
  readonly fileId?: string;
  readonly onBack?: () => void;
}

interface CbzDocumentState {
  readonly archive: CbzArchive;
  readonly file: LocalFileMetadata;
  readonly workId: Work["id"] | null;
}

interface DisplayPage {
  readonly index: number;
  readonly url: string;
  readonly dimensions: CbzLoadedPage["dimensions"];
  readonly retainedBytes: number;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function CbzReader({ fileId, onBack }: CbzReaderProps) {
  const library = useLibraryStore();
  const libraryItemsRef = React.useRef(library.items);
  libraryItemsRef.current = library.items;
  const latestAnchorRef = React.useRef<ProgressAnchor | null>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const cachedPagesRef = React.useRef(new Map<number, DisplayPage>());
  const [reader, setReader] = React.useState<CbzDocumentState | null>(null);
  const [pageStartIndex, setPageStartIndex] = React.useState(0);
  const [pageTurnKey, setPageTurnKey] = React.useState(0);
  const triggerPageTurn = React.useCallback(() => {
    setPageTurnKey((key) => key + 1);
  }, []);
  const [displayPages, setDisplayPages] = React.useState<DisplayPage[]>([]);
  const [spread, setSpread] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPageLoading, setIsPageLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [sessionElapsed, setSessionElapsed] = React.useState(0);
  const [memoryDraft, setMemoryDraft] = React.useState("");

  React.useEffect(() => {
    if (!fileId) {
      setError("A local file was not selected.");
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setWarning(null);
    setReader(null);
    setDisplayPages([]);
    for (const page of cachedPagesRef.current.values()) URL.revokeObjectURL(page.url);
    cachedPagesRef.current.clear();
    const load = async () => {
      const file = (await listLocalFiles()).find((item) => item.id === fileId);
      if (!file || file.format !== "cbz") throw new Error("This local file is not a CBZ archive.");
      const archive = await openCbz(await getLocalFileBlob(file.id));
      if (cancelled) return;
      const work = file.workId
        ? libraryItemsRef.current.find((item) => item.work.id === file.workId)
        : undefined;
      const initialPage = toCbzPageNumber(
        work?.relationship?.currentAnchor ?? null,
        archive.pages.length,
      );
      latestAnchorRef.current = toCbzPageAnchor(initialPage, archive.pages.length);
      setPageStartIndex(initialPage - 1);
      setReader({ archive, file, workId: work?.work.id ?? null });
      setIsLoading(false);
    };
    void load().catch((loadError: unknown) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : "Unable to open this CBZ file.");
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const saveProgress = React.useCallback(
    (index: number) => {
      if (!reader) return;
      const anchor = toCbzPageAnchor(index + 1, reader.archive.pages.length);
      latestAnchorRef.current = anchor;
      if (!reader.workId) return;
      try {
        library.recordProgress(reader.workId, anchor);
        setWarning(null);
      } catch (progressError) {
        setWarning(
          progressError instanceof Error
            ? `Page changed, but progress could not be saved: ${progressError.message}`
            : "Page changed, but progress could not be saved.",
        );
      }
    },
    [reader, library.recordProgress],
  );

  React.useEffect(() => {
    if (!reader) return;
    const controller = new AbortController();
    let cancelled = false;
    const loadPages = async () => {
      setIsPageLoading(true);
      setError(null);
      setWarning(null);
      setDisplayPages([]);
      const cacheIndexes = getCbzCacheWindow(pageStartIndex, reader.archive.pages.length);
      const existing = cachedPagesRef.current;
      for (const [index, page] of existing) {
        if (!cacheIndexes.includes(index)) {
          URL.revokeObjectURL(page.url);
          existing.delete(index);
        }
      }
      const currentPages = () => Array.from(existing.values()).sort((a, b) => a.index - b.index);
      let retainedBytes = currentPages().reduce((total, page) => total + page.retainedBytes, 0);
      const loadOrder = [
        pageStartIndex,
        ...(spread ? [pageStartIndex + 1] : []),
        ...cacheIndexes.filter(
          (index) => index !== pageStartIndex && (!spread || index !== pageStartIndex + 1),
        ),
      ];
      const requestedIndexes = new Set(loadOrder.slice(0, spread ? 2 : 1));
      for (const index of loadOrder) {
        if (!cacheIndexes.includes(index) || existing.has(index)) continue;
        const image = await reader.archive.loadPage(index, controller.signal);
        if (cancelled) return;
        if (!image) continue;
        const decodedSize = image.dimensions.width * image.dimensions.height * 4;
        while (decodedSize + retainedBytes > MAX_CACHED_BITMAP_BYTES) {
          const evictable = currentPages()
            .filter((page) => !requestedIndexes.has(page.index))
            .sort(
              (left, right) =>
                Math.abs(right.index - pageStartIndex) - Math.abs(left.index - pageStartIndex),
            )[0];
          if (!evictable) break;
          URL.revokeObjectURL(evictable.url);
          existing.delete(evictable.index);
          retainedBytes -= evictable.retainedBytes;
        }
        if (decodedSize + retainedBytes > MAX_CACHED_BITMAP_BYTES) {
          if (index === pageStartIndex) {
            throw new Error("The active comic page exceeds the 64 MB decoded-page cache limit.");
          }
          if (spread && index === pageStartIndex + 1) {
            setWarning("The second spread page was omitted to stay within the 64 MB cache limit.");
          }
          continue;
        }
        const cached: DisplayPage = {
          index,
          url: URL.createObjectURL(image.blob),
          dimensions: image.dimensions,
          retainedBytes: decodedSize,
        };
        existing.set(index, cached);
        retainedBytes += decodedSize;
      }
      if (cancelled) return;
      const pages = currentPages();
      if (pages.length === 0) throw new Error("No safe image pages remain in this CBZ archive.");
      const activePages = pages.filter(
        (page) => page.index === pageStartIndex || (spread && page.index === pageStartIndex + 1),
      );
      const visible =
        activePages.length > 0
          ? activePages
          : pages
              .sort(
                (left, right) =>
                  Math.abs(left.index - pageStartIndex) - Math.abs(right.index - pageStartIndex),
              )
              .slice(0, 1);
      setDisplayPages(visible);
      const actualPage = visible[0]?.index ?? pageStartIndex;
      if (actualPage !== pageStartIndex) setPageStartIndex(actualPage);
      saveProgress(actualPage);
      setIsPageLoading(false);
    };
    void loadPages().catch((pageError: unknown) => {
      if (!cancelled) {
        setError(
          pageError instanceof Error ? pageError.message : "Unable to decode this comic page.",
        );
        setIsPageLoading(false);
      }
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reader, pageStartIndex, spread, saveProgress]);

  React.useEffect(
    () => () => {
      for (const page of cachedPagesRef.current.values()) URL.revokeObjectURL(page.url);
      cachedPagesRef.current.clear();
    },
    [],
  );

  React.useEffect(() => {
    if (!reader) return;
    let cancelled = false;
    let sessionId: string | null = null;
    let startedAt: string | null = null;
    let heartbeatBusy = false;
    let ticks = 0;
    const start = async () => {
      const session = await startReaderSession(
        reader.file.id,
        reader.file.workId,
        latestAnchorRef.current,
      );
      if (cancelled) {
        await endReaderSession(
          session.id,
          latestAnchorRef.current ?? toCbzPageAnchor(1, reader.archive.pages.length),
        );
        return;
      }
      sessionId = session.id;
      startedAt = session.startedAt;
    };
    void start().catch(() => {
      if (!cancelled) setWarning("Reading time is not being recorded.");
    });
    const timer = window.setInterval(() => {
      ticks += 1;
      if (startedAt) setSessionElapsed(Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
      if (!sessionId || ticks % 15 !== 0 || heartbeatBusy) return;
      heartbeatBusy = true;
      void updateReaderSession(
        sessionId,
        latestAnchorRef.current ?? toCbzPageAnchor(1, reader.archive.pages.length),
      )
        .catch(() => {
          if (!cancelled) setWarning("Reading session checkpoint failed.");
        })
        .finally(() => {
          heartbeatBusy = false;
        });
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (sessionId) {
        void endReaderSession(
          sessionId,
          latestAnchorRef.current ?? toCbzPageAnchor(1, reader.archive.pages.length),
        ).catch(() => {
          if (!cancelled) setWarning("The final reading position could not be saved.");
        });
      }
    };
  }, [reader]);

  const navigatePage = (index: number) => {
    if (!reader || index < 0 || index >= reader.archive.pages.length) return;
    setPageStartIndex(index);
    triggerPageTurn();
  };

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        navigatePage(pageStartIndex + (spread ? 2 : 1));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        navigatePage(pageStartIndex - (spread ? 2 : 1));
      } else if (event.key === "Escape") {
        onBack?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageStartIndex, spread, reader, onBack]);

  if (isLoading) {
    return (
      <main className="flex min-h-[32rem] items-center justify-center gap-2 text-[var(--gm-text-muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Scanning CBZ directory locally…
      </main>
    );
  }
  if (error && !reader) {
    return (
      <main className="flex min-h-[32rem] flex-col items-center justify-center gap-4 p-8 text-center">
        <p role="alert" className="max-w-xl text-gm-sm text-[var(--gm-danger)]">
          {error}
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to Local Shelf
        </Button>
      </main>
    );
  }

  const totalPages = reader?.archive.pages.length ?? 0;
  const currentPage = displayPages[0]?.index ?? pageStartIndex;
  const saveMemory = () => {
    if (!reader?.workId || !memoryDraft.trim()) return;
    const linkedWork = library.items.find((item) => item.work.id === reader.workId);
    if (!linkedWork) {
      setWarning("The linked Work is unavailable; this panel note was not saved.");
      return;
    }
    try {
      clientRepository.addMemory(linkedWork.work.id, {
        type: MemoryType.PersonalNote,
        title: `CBZ page ${currentPage + 1}`,
        body: memoryDraft.trim(),
        privacyState: PrivacyState.Private,
        spoilerLevel: SpoilerLevel.SpoilerFree,
        showInGlobalGallery: true,
        accessPathId:
          linkedWork.relationship?.preferredAccessPathId ??
          linkedWork.accessPaths.find((path) => path.isPreferred)?.id ??
          linkedWork.accessPaths[0]?.id ??
          null,
        progressAnchor: latestAnchorRef.current ?? toCbzPageAnchor(currentPage + 1, totalPages),
        assets: [],
        tags: [],
      });
      library.refresh();
      setMemoryDraft("");
      setWarning(null);
    } catch (memoryError) {
      setWarning(
        memoryError instanceof Error
          ? `Panel note could not be saved: ${memoryError.message}`
          : "Panel note could not be saved.",
      );
    }
  };

  return (
    <main className="flex h-[calc(100vh-4rem)] min-h-[32rem] flex-col bg-[var(--gm-bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to Local Shelf" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-[var(--gm-text)]">
              {reader?.file.displayName ?? "CBZ Reader"}
            </h1>
            <p className="text-gm-xs text-[var(--gm-text-muted)]">
              Page {currentPage + 1} of {totalPages} · Session {formatDuration(sessionElapsed)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            aria-pressed={spread}
            onClick={() => setSpread((value) => !value)}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {spread ? "Single page" : "Double-page spread"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={currentPage <= 0}
            onClick={() => navigatePage(currentPage - (spread ? 2 : 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={currentPage >= totalPages - 1}
            onClick={() => navigatePage(currentPage + (spread ? 2 : 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {warning && (
        <div
          role="status"
          className="border-b border-[var(--gm-warning)]/40 bg-[var(--gm-warning-muted)] px-4 py-2 text-center text-gm-xs text-[var(--gm-warning)]"
        >
          {warning}
        </div>
      )}
      {reader?.workId && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveMemory();
          }}
          className="flex flex-wrap items-center gap-2 border-b border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-2"
        >
          <label htmlFor="cbz-memory" className="sr-only">
            Note for comic page {currentPage + 1}
          </label>
          <input
            id="cbz-memory"
            value={memoryDraft}
            onChange={(event) => setMemoryDraft(event.target.value)}
            maxLength={5000}
            placeholder={`Add a note for page ${currentPage + 1}`}
            className="min-w-48 flex-1 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
          />
          <Button type="submit" variant="outline" disabled={!memoryDraft.trim()}>
            Save panel note
          </Button>
        </form>
      )}
      <section
        aria-label="Comic page"
        onPointerDown={(event) => {
          const target = event.target;
          const isControl =
            target instanceof Element && Boolean(target.closest("button, input, select"));
          if (event.pointerType === "touch" && event.isPrimary && !isControl) {
            touchStartRef.current = { x: event.clientX, y: event.clientY };
          }
        }}
        onPointerUp={(event) => {
          const start = touchStartRef.current;
          touchStartRef.current = null;
          if (!start || event.pointerType !== "touch") return;
          const deltaX = event.clientX - start.x;
          const deltaY = event.clientY - start.y;
          if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
          navigatePage(pageStartIndex + (deltaX < 0 ? 1 : -1) * (spread ? 2 : 1));
        }}
        onPointerCancel={() => {
          touchStartRef.current = null;
        }}
        style={{ touchAction: "pan-y pinch-zoom" }}
        className={`relative flex min-h-0 flex-1 items-center justify-center gap-2 overflow-hidden p-2 ${
          displayPages.length > 1 ? "flex-row" : "flex-col"
        }`}
      >
        {isPageLoading && (
          <div className="flex items-center gap-2 text-[var(--gm-text-muted)]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading page…
          </div>
        )}
        {error && reader && (
          <p role="alert" className="max-w-xl text-center text-gm-sm text-[var(--gm-danger)]">
            {error}
          </p>
        )}
        {!error &&
          displayPages.map((page) => (
            <img
              key={`${page.index}-${page.url}-${pageTurnKey}`}
              src={page.url}
              alt={`Comic page ${page.index + 1}`}
              className={`h-full min-h-0 min-w-0 flex-1 object-contain gm-page-turn-active ${
                displayPages.length > 1 ? "max-w-[50%]" : "max-w-full"
              }`}
              decoding="async"
              draggable={false}
            />
          ))}
        {totalPages > 0 && (
          <>
            <button
              type="button"
              aria-label="Previous pages"
              disabled={currentPage <= 0}
              onClick={() => navigatePage(currentPage - (spread ? 2 : 1))}
              className="absolute inset-y-0 left-0 z-10 flex w-12 items-center justify-center rounded-r-cv bg-[var(--gm-surface)]/70 text-[var(--gm-text)] disabled:opacity-30 sm:hidden"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next pages"
              disabled={currentPage >= totalPages - 1}
              onClick={() => navigatePage(currentPage + (spread ? 2 : 1))}
              className="absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center rounded-l-cv bg-[var(--gm-surface)]/70 text-[var(--gm-text)] disabled:opacity-30 sm:hidden"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </section>

      <footer className="flex items-center gap-3 border-t border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-3">
        <span className="min-w-16 text-gm-xs text-[var(--gm-text-muted)]">{currentPage + 1}</span>
        <label className="sr-only" htmlFor="cbz-page">
          Comic page
        </label>
        <input
          id="cbz-page"
          type="range"
          min="0"
          max={Math.max(totalPages - 1, 0)}
          value={currentPage}
          onChange={(event) => navigatePage(Number(event.target.value))}
          className="min-w-28 flex-1 accent-[var(--gm-accent-strong)]"
        />
        <span className="min-w-16 text-right text-gm-xs text-[var(--gm-text-muted)]">
          {totalPages > 0 ? `${Math.round(((currentPage + 1) / totalPages) * 100)}%` : "0%"}
        </span>
      </footer>
    </main>
  );
}
