import * as React from "react";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getDocument,
  GlobalWorkerOptions,
  TextLayer,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  findPdfTextMatches,
  getLocalFileBlob,
  getPdfPageFromAnchor,
  listLocalFiles,
  startReaderSession,
  updateReaderSession,
  endReaderSession,
  listPdfBookmarks,
  resolvePdfOutline,
  togglePdfBookmark,
  toPdfProgressAnchor,
} from "@chronicles-vault/reader";
import type { PdfTextMatch } from "@chronicles-vault/reader";
import type { LocalFileMetadata } from "@chronicles-vault/reader";
import type { PdfBookmark, PdfOutlineEntry } from "@chronicles-vault/reader";
import type { ProgressAnchor } from "@chronicles-vault/domain";
import {
  MemoryType,
  PrivacyState,
  SpoilerLevel,
  formatProgressAnchor,
} from "@chronicles-vault/domain";
import { clientRepository, useLibraryStore } from "@chronicles-vault/state";
import { Button } from "@chronicles-vault/ui";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
const MAX_PDF_SEARCH_PAGES = 5000;

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export interface PdfReaderProps {
  fileId?: string;
  onBack?: () => void;
}

export function PdfReader({ fileId, onBack }: PdfReaderProps) {
  const canvasRefs = React.useRef<Array<HTMLCanvasElement | null>>([]);
  const textLayerRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const searchRequestRef = React.useRef(0);
  const latestAnchorRef = React.useRef<ProgressAnchor | null>(null);
  const library = useLibraryStore();
  const [file, setFile] = React.useState<LocalFileMetadata | null>(null);
  const [document, setDocument] = React.useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [fitMode, setFitMode] = React.useState<"fit-width" | "fit-height">("fit-width");
  const [spreadMode, setSpreadMode] = React.useState(false);
  const [outline, setOutline] = React.useState<PdfOutlineEntry[]>([]);
  const [bookmarks, setBookmarks] = React.useState<PdfBookmark[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [progressWarning, setProgressWarning] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<PdfTextMatch[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = React.useState<number | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [sessionElapsed, setSessionElapsed] = React.useState(0);
  const [memoryDraft, setMemoryDraft] = React.useState("");
  const [selectedQuote, setSelectedQuote] = React.useState("");
  const [selectedQuotePage, setSelectedQuotePage] = React.useState<number | null>(null);
  const visiblePageNumbers = React.useMemo(
    () =>
      spreadMode && pageNumber < pageCount
        ? [pageNumber, pageNumber + 1]
        : pageNumber > 0 && pageCount > 0
          ? [pageNumber]
          : [],
    [pageCount, pageNumber, spreadMode],
  );
  const isSpreadVisible = spreadMode && visiblePageNumbers.length > 1;
  const lastVisiblePage = visiblePageNumbers[visiblePageNumbers.length - 1] ?? pageNumber;
  const canAdvance = lastVisiblePage < pageCount;

  React.useEffect(() => {
    if (!fileId) {
      setError("A local file was not selected.");
      setIsLoading(false);
      return;
    }

    let disposed = false;
    let loadingTask: ReturnType<typeof getDocument> | undefined;
    let loadedDocument: PDFDocumentProxy | undefined;
    setIsLoading(true);
    setError(null);
    setProgressWarning(null);
    setSessionElapsed(0);
    setDocument(null);
    setFile(null);
    setSearchResults([]);
    setActiveSearchIndex(null);
    setIsSearching(false);
    setPageCount(0);
    setPageNumber(1);
    setSpreadMode(false);
    setSelectedQuote("");
    setSelectedQuotePage(null);
    setOutline([]);
    setBookmarks([]);

    const load = async () => {
      const storedFile = (await listLocalFiles()).find((item) => item.id === fileId);
      if (!storedFile) throw new Error("This file is no longer on your Local Shelf.");
      if (storedFile.format !== "pdf") throw new Error("Only PDF files can be opened right now.");

      const blob = await getLocalFileBlob(fileId);
      const data = new Uint8Array(await blob.arrayBuffer());
      loadingTask = getDocument({
        data,
        isEvalSupported: false,
        enableXfa: false,
        disableAutoFetch: true,
        disableStream: true,
      });
      loadedDocument = await loadingTask.promise;
      if (disposed) {
        await loadedDocument.destroy();
        return;
      }
      const work = storedFile.workId
        ? library.items.find((item) => item.work.id === storedFile.workId)
        : undefined;
      const initialPage = getPdfPageFromAnchor(
        work?.relationship?.currentAnchor ?? null,
        loadedDocument.numPages,
      );
      latestAnchorRef.current = toPdfProgressAnchor(initialPage, loadedDocument.numPages);
      setFile(storedFile);
      setPageCount(loadedDocument.numPages);
      setPageNumber(initialPage);
      setDocument(loadedDocument);
      setIsLoading(false);
      const [outlineResult, bookmarksResult] = await Promise.allSettled([
        loadedDocument.getOutline(),
        listPdfBookmarks(storedFile.id),
      ]);
      if (disposed) return;
      if (outlineResult.status === "rejected" || bookmarksResult.status === "rejected") {
        setProgressWarning("Some PDF navigation data could not be loaded.");
      }
      if (outlineResult.status === "fulfilled" && outlineResult.value) {
        try {
          setOutline(
            await resolvePdfOutline(outlineResult.value, {
              getDestination: (name) => loadedDocument!.getDestination(name),
              getPageIndex: (reference) => loadedDocument!.getPageIndex(reference),
            }),
          );
        } catch (outlineError) {
          setProgressWarning(
            outlineError instanceof Error
              ? `PDF outline unavailable: ${outlineError.message}`
              : "PDF outline unavailable; page reading is still available.",
          );
        }
      } else {
        setOutline([]);
      }
      setBookmarks(bookmarksResult.status === "fulfilled" ? bookmarksResult.value : []);
    };

    void load().catch((loadError: unknown) => {
      if (disposed) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to open this PDF.");
      setIsLoading(false);
    });

    return () => {
      disposed = true;
      searchRequestRef.current += 1;
      if (loadingTask) void loadingTask.destroy();
      else if (loadedDocument) void loadedDocument.destroy();
    };
  }, [fileId]);

  React.useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!document || !file || pageCount < 1) return;
    let cancelled = false;
    let sessionId: string | null = null;
    let startedAt: string | null = null;
    let heartbeatBusy = false;
    let tick = 0;

    const beginSession = async () => {
      const session = await startReaderSession(file.id, file.workId, latestAnchorRef.current);
      if (cancelled) {
        try {
          await endReaderSession(
            session.id,
            latestAnchorRef.current ?? toPdfProgressAnchor(1, pageCount),
          );
        } catch (sessionError) {
          console.error(
            "Unable to close a reader session that ended during startup.",
            sessionError,
          );
        }
        return;
      }
      sessionId = session.id;
      startedAt = session.startedAt;
      setSessionElapsed(0);
    };

    void beginSession().catch((sessionError: unknown) => {
      if (!cancelled) {
        setProgressWarning(
          sessionError instanceof Error
            ? `Reading time is not being recorded: ${sessionError.message}`
            : "Reading time is not being recorded.",
        );
      }
    });

    const timer = window.setInterval(() => {
      tick += 1;
      if (startedAt) {
        setSessionElapsed(Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
      }
      if (!sessionId || tick % 15 !== 0 || heartbeatBusy) return;
      heartbeatBusy = true;
      void updateReaderSession(
        sessionId,
        latestAnchorRef.current ?? toPdfProgressAnchor(pageNumber, pageCount),
      )
        .catch((sessionError: unknown) => {
          if (!cancelled) {
            setProgressWarning(
              sessionError instanceof Error
                ? `Reading session checkpoint failed: ${sessionError.message}`
                : "Reading session checkpoint failed.",
            );
          }
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
          latestAnchorRef.current ?? toPdfProgressAnchor(pageNumber, pageCount),
        ).catch((sessionError: unknown) => {
          console.error("Unable to save the final reader session checkpoint.", sessionError);
        });
      }
    };
  }, [document, file?.id, file?.workId, pageCount]);

  React.useEffect(() => {
    if (!document || containerWidth <= 0 || containerHeight <= 0 || visiblePageNumbers.length === 0)
      return;
    let cancelled = false;
    const renderTasks: Array<ReturnType<PDFPageProxy["render"]>> = [];
    const textLayers: TextLayer[] = [];
    const render = async () => {
      const pages = await Promise.all(visiblePageNumbers.map((number) => document.getPage(number)));
      if (cancelled) return;
      const baseViewports = pages.map((page) => page.getViewport({ scale: 1 }));
      const availableWidth = Math.max(containerWidth - 32, 1);
      const availableHeight = Math.max(containerHeight - 32, 1);
      const slotWidth = isSpreadVisible ? Math.max((availableWidth - 16) / 2, 1) : availableWidth;
      const widestPage = Math.max(...baseViewports.map((viewport) => viewport.width));
      const tallestPage = Math.max(...baseViewports.map((viewport) => viewport.height));
      const spreadFitScale = Math.min(slotWidth / widestPage, availableHeight / tallestPage);

      for (const [index, page] of pages.entries()) {
        const baseViewport = baseViewports[index]!;
        const canvas = canvasRefs.current[index];
        const textContainer = textLayerRefs.current[index];
        if (!canvas || !textContainer) {
          throw new Error("Unable to create a PDF page display.");
        }
        const widthScale = slotWidth / baseViewport.width;
        const heightScale = availableHeight / baseViewport.height;
        const fitScale = isSpreadVisible
          ? Math.min(spreadFitScale, widthScale, heightScale) * zoom
          : Math.min(Math.max(fitMode === "fit-height" ? heightScale : widthScale, 0.1), 1.75) *
            zoom;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const maxPixelScale = Math.min(
          8192 / baseViewport.width,
          8192 / baseViewport.height,
          Math.sqrt(16_000_000 / (baseViewport.width * baseViewport.height)),
        );
        const outputScale = Math.min(fitScale * pixelRatio, maxPixelScale);
        const viewport = page.getViewport({ scale: outputScale });
        const displayViewport = page.getViewport({ scale: fitScale });
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Unable to create a PDF rendering surface.");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${displayViewport.width}px`;
        canvas.style.height = `${displayViewport.height}px`;
        textContainer.style.width = `${displayViewport.width}px`;
        textContainer.style.height = `${displayViewport.height}px`;
        textContainer.style.setProperty("--scale-factor", String(fitScale));
        textContainer.replaceChildren();
        const renderTask = page.render({ canvasContext: context, viewport });
        renderTasks.push(renderTask);
        const textContent = await page.getTextContent();
        if (cancelled) return;
        const textLayer = new TextLayer({
          textContentSource: textContent,
          container: textContainer,
          viewport: displayViewport,
        });
        textLayers.push(textLayer);
        const renderPromise = renderTask.promise;
        await Promise.all([textLayer.render(), renderPromise]);
        if (cancelled) return;
      }
    };
    void render().catch((renderError: unknown) => {
      if (!cancelled) {
        setError(
          renderError instanceof Error ? renderError.message : "Unable to render this PDF page.",
        );
      }
    });
    return () => {
      cancelled = true;
      for (const task of renderTasks) task.cancel();
      for (const textLayer of textLayers) textLayer.cancel();
      for (const textLayer of textLayerRefs.current) textLayer?.replaceChildren();
    };
  }, [
    document,
    visiblePageNumbers,
    containerWidth,
    containerHeight,
    zoom,
    fitMode,
    isSpreadVisible,
  ]);

  const runSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!document) return;
    const query = searchQuery.trim();
    const requestId = ++searchRequestRef.current;
    setSearchError(null);
    setSearchResults([]);
    setActiveSearchIndex(null);
    if (!query) return;
    if (document.numPages > MAX_PDF_SEARCH_PAGES) {
      setSearchError(
        `Search is limited to documents with ${MAX_PDF_SEARCH_PAGES.toLocaleString()} pages.`,
      );
      return;
    }

    setIsSearching(true);
    try {
      const results: PdfTextMatch[] = [];
      for (let page = 1; page <= document.numPages; page += 1) {
        if (requestId !== searchRequestRef.current) return;
        const pageProxy = await document.getPage(page);
        const textContent = await pageProxy.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" ");
        for (const match of findPdfTextMatches([pageText], query, 100 - results.length)) {
          results.push({ ...match, pageNumber: page, matchIndex: results.length });
        }
        if (results.length === 100) break;
      }
      if (requestId !== searchRequestRef.current) return;
      setSearchResults(results);
      setActiveSearchIndex(results.length > 0 ? 0 : null);
      setSearchError(results.length === 0 ? "No matches found." : null);
      if (results[0]) navigatePage(results[0].pageNumber);
    } catch (searchFailure) {
      if (requestId === searchRequestRef.current) {
        setSearchError(
          searchFailure instanceof Error ? searchFailure.message : "Unable to search this PDF.",
        );
      }
    } finally {
      if (requestId === searchRequestRef.current) setIsSearching(false);
    }
  };

  const navigateToSearchResult = (result: PdfTextMatch) => {
    setActiveSearchIndex(result.matchIndex);
    navigatePage(result.pageNumber);
  };

  const navigatePage = (nextPage: number) => {
    if (!file || !pageCount || nextPage < 1 || nextPage > pageCount) return;
    setPageNumber(nextPage);
    setSelectedQuote("");
    setSelectedQuotePage(null);
    latestAnchorRef.current = toPdfProgressAnchor(nextPage, pageCount);
    setProgressWarning(null);
    const linkedWork = file.workId
      ? library.items.find((item) => item.work.id === file.workId)
      : undefined;
    if (linkedWork) {
      try {
        library.recordProgress(linkedWork.work.id, toPdfProgressAnchor(nextPage, pageCount));
      } catch (progressError) {
        setProgressWarning(
          progressError instanceof Error
            ? `Page changed, but progress could not be saved: ${progressError.message}`
            : "Page changed, but progress could not be saved.",
        );
      }
    }
  };

  const saveBookmark = async () => {
    if (!file || pageCount < 1) return;
    try {
      await togglePdfBookmark(file.id, pageNumber, pageCount);
      setBookmarks(await listPdfBookmarks(file.id));
      setProgressWarning(null);
    } catch (bookmarkError) {
      setProgressWarning(
        bookmarkError instanceof Error
          ? `Bookmark could not be saved: ${bookmarkError.message}`
          : "Bookmark could not be saved.",
      );
    }
  };

  const savePageMemory = () => {
    if (!file?.workId || !memoryDraft.trim()) return;
    const linkedWork = library.items.find((item) => item.work.id === file.workId);
    if (!linkedWork) {
      setProgressWarning("The linked Work is unavailable; this page note was not saved.");
      return;
    }
    try {
      clientRepository.addMemory(linkedWork.work.id, {
        type: MemoryType.PersonalNote,
        title: `PDF page ${pageNumber}`,
        body: memoryDraft.trim(),
        privacyState: PrivacyState.Private,
        spoilerLevel: SpoilerLevel.SpoilerFree,
        showInGlobalGallery: true,
        accessPathId:
          linkedWork.relationship?.preferredAccessPathId ??
          linkedWork.accessPaths.find((path) => path.isPreferred)?.id ??
          linkedWork.accessPaths[0]?.id ??
          null,
        progressAnchor: toPdfProgressAnchor(pageNumber, pageCount),
        assets: [],
        tags: [],
      });
      library.refresh();
      setMemoryDraft("");
      setProgressWarning(null);
    } catch (memoryError) {
      setProgressWarning(
        memoryError instanceof Error
          ? `Page note could not be saved: ${memoryError.message}`
          : "Page note could not be saved.",
      );
    }
  };

  const saveSelectedQuote = () => {
    if (!file?.workId || !selectedQuote || selectedQuotePage === null) return;
    const linkedWork = library.items.find((item) => item.work.id === file.workId);
    if (!linkedWork) {
      setProgressWarning("The linked Work is unavailable; this quote was not saved.");
      return;
    }
    try {
      clientRepository.addMemory(linkedWork.work.id, {
        type: MemoryType.Quote,
        title: `Quote · page ${selectedQuotePage}`,
        body: selectedQuote,
        privacyState: PrivacyState.Private,
        spoilerLevel: SpoilerLevel.Major,
        showInGlobalGallery: true,
        accessPathId:
          linkedWork.relationship?.preferredAccessPathId ??
          linkedWork.accessPaths.find((path) => path.isPreferred)?.id ??
          linkedWork.accessPaths[0]?.id ??
          null,
        progressAnchor: toPdfProgressAnchor(selectedQuotePage, pageCount),
        assets: [],
        tags: [],
      });
      library.refresh();
      setSelectedQuote("");
      setSelectedQuotePage(null);
      window.getSelection()?.removeAllRanges();
      setProgressWarning(null);
    } catch (memoryError) {
      setProgressWarning(
        memoryError instanceof Error
          ? `Quote could not be saved: ${memoryError.message}`
          : "Quote could not be saved.",
      );
    }
  };

  React.useEffect(() => {
    const updateSelection = () => {
      const selection = window.getSelection();
      const anchor = selection?.anchorNode ?? null;
      const focus = selection?.focusNode ?? null;
      if (!selection || selection.isCollapsed) {
        setSelectedQuote("");
        setSelectedQuotePage(null);
        return;
      }
      const anchorLayer = textLayerRefs.current.findIndex((layer) =>
        layer?.contains(anchor ?? null),
      );
      const focusLayer = textLayerRefs.current.findIndex((layer) => layer?.contains(focus ?? null));
      if (anchorLayer < 0 || anchorLayer !== focusLayer || !visiblePageNumbers[anchorLayer]) {
        setSelectedQuote("");
        setSelectedQuotePage(null);
        return;
      }
      const quote = selection.toString().trim().slice(0, 5000);
      setSelectedQuote(quote);
      setSelectedQuotePage(quote ? visiblePageNumbers[anchorLayer]! : null);
    };
    window.document.addEventListener("selectionchange", updateSelection);
    return () => window.document.removeEventListener("selectionchange", updateSelection);
  }, [visiblePageNumbers]);

  const renderOutline = (
    entries: readonly PdfOutlineEntry[],
    depth = 0,
    parentKey = "outline",
  ): React.ReactNode =>
    entries.map((entry, index) => (
      <React.Fragment key={`${parentKey}-${depth}-${index}-${entry.pageNumber}`}>
        <button
          type="button"
          className="block w-full truncate rounded px-2 py-1 text-left text-cv-xs text-[var(--cv-text)] hover:bg-[var(--cv-accent-muted)]"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => navigatePage(entry.pageNumber)}
        >
          {entry.title} <span className="text-[var(--cv-text-muted)]">· {entry.pageNumber}</span>
        </button>
        {entry.children.length > 0 &&
          renderOutline(entry.children, depth + 1, `${parentKey}-${index}`)}
      </React.Fragment>
    ));

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        window.document.getElementById("pdf-search")?.focus();
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const step = spreadMode ? 2 : 1;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        if (lastVisiblePage >= pageCount) return;
        event.preventDefault();
        navigatePage(Math.min(pageNumber + step, pageCount));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        navigatePage(Math.max(pageNumber - step, 1));
      } else if (event.key === "Escape") {
        onBack?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [file, pageNumber, pageCount, spreadMode, lastVisiblePage, onBack, library.recordProgress]);

  return (
    <main className="flex h-[calc(100vh-4rem)] min-h-[32rem] flex-col bg-[var(--cv-bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to Local Shelf" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-[var(--cv-text)]">
              {file?.displayName ?? "PDF Reader"}
            </h1>
            <p className="text-cv-xs text-[var(--cv-text-muted)]">
              {pageCount > 0
                ? lastVisiblePage > pageNumber
                  ? `Pages ${pageNumber}–${lastVisiblePage} of ${pageCount}`
                  : `Page ${pageNumber} of ${pageCount}`
                : "Local PDF"}
              {file && pageCount > 0 ? ` · Session ${formatDuration(sessionElapsed)}` : ""}
            </p>
          </div>
        </div>
        {pageCount > 0 && (
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="pdf-fit-mode">
              Page fit mode
            </label>
            <select
              id="pdf-fit-mode"
              value={fitMode}
              onChange={(event) => setFitMode(event.target.value as "fit-width" | "fit-height")}
              className="max-w-28 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-2 py-2 text-cv-xs text-[var(--cv-text)]"
            >
              <option value="fit-width">Fit width</option>
              <option value="fit-height">Fit height</option>
            </select>
            <Button
              variant={spreadMode ? "default" : "outline"}
              aria-pressed={spreadMode}
              onClick={() => {
                setSpreadMode((enabled) => !enabled);
                setSelectedQuote("");
                setSelectedQuotePage(null);
                window.getSelection()?.removeAllRanges();
              }}
            >
              Double-page spread
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={
                bookmarks.some((bookmark) => bookmark.pageNumber === pageNumber)
                  ? "Remove bookmark"
                  : "Bookmark page"
              }
              onClick={() => void saveBookmark()}
            >
              <Bookmark
                className="h-4 w-4"
                fill={
                  bookmarks.some((bookmark) => bookmark.pageNumber === pageNumber)
                    ? "currentColor"
                    : "none"
                }
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Zoom out"
              disabled={zoom <= 0.6}
              onClick={() => setZoom((value) => Math.max(0.6, value - 0.2))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-cv-xs text-[var(--cv-text-muted)]">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Zoom in"
              disabled={zoom >= 2}
              onClick={() => setZoom((value) => Math.min(2, value + 0.2))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="mx-1 h-6 border-l border-[var(--cv-border)]" />
            <Button
              variant="outline"
              size="icon"
              aria-label={spreadMode ? "Previous spread" : "Previous page"}
              disabled={pageNumber <= 1}
              onClick={() => navigatePage(Math.max(pageNumber - (spreadMode ? 2 : 1), 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center text-cv-sm text-[var(--cv-text)]">
              {pageNumber} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={spreadMode ? "Next spread" : "Next page"}
              disabled={!canAdvance}
              onClick={() => navigatePage(Math.min(pageNumber + (spreadMode ? 2 : 1), pageCount))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </header>

      <form
        onSubmit={(event) => void runSearch(event)}
        className="flex flex-wrap items-center gap-2 border-b border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2"
      >
        <label htmlFor="pdf-search" className="sr-only">
          Search this PDF
        </label>
        <input
          id="pdf-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search this PDF"
          className="min-w-48 flex-1 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-3 py-2 text-cv-sm text-[var(--cv-text)]"
        />
        <Button type="submit" variant="outline" disabled={!document || isSearching}>
          {isSearching ? "Searching…" : "Search"}
        </Button>
        {searchResults.length > 0 && (
          <span className="text-cv-xs text-[var(--cv-text-muted)]">
            {activeSearchIndex === null ? 0 : activeSearchIndex + 1} of {searchResults.length}{" "}
            matches
          </span>
        )}
      </form>
      {(outline.length > 0 || bookmarks.length > 0) && (
        <nav
          aria-label="PDF navigation"
          className="flex max-h-36 gap-4 overflow-auto border-b border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2"
        >
          {outline.length > 0 && (
            <section className="min-w-56 flex-1" aria-label="Document outline">
              <h2 className="px-2 pb-1 text-cv-xs font-semibold text-[var(--cv-text-muted)]">
                Contents
              </h2>
              {renderOutline(outline)}
            </section>
          )}
          {bookmarks.length > 0 && (
            <section className="min-w-44" aria-label="Saved bookmarks">
              <h2 className="px-2 pb-1 text-cv-xs font-semibold text-[var(--cv-text-muted)]">
                Bookmarks
              </h2>
              {bookmarks.map((bookmark) => (
                <button
                  key={bookmark.id}
                  type="button"
                  className="block w-full rounded px-2 py-1 text-left text-cv-xs text-[var(--cv-text)] hover:bg-[var(--cv-accent-muted)]"
                  onClick={() => navigatePage(bookmark.pageNumber)}
                >
                  {bookmark.title}
                </button>
              ))}
            </section>
          )}
        </nav>
      )}
      {searchError && (
        <div
          role="status"
          className="border-b border-[var(--cv-border)] px-4 py-2 text-center text-cv-xs text-[var(--cv-text-muted)]"
        >
          {searchError}
        </div>
      )}
      {file?.workId && pageCount > 0 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            savePageMemory();
          }}
          className="flex flex-wrap items-center gap-2 border-b border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2"
        >
          <label htmlFor="pdf-page-memory" className="sr-only">
            Note for {formatProgressAnchor(toPdfProgressAnchor(pageNumber, pageCount))}
          </label>
          <input
            id="pdf-page-memory"
            value={memoryDraft}
            onChange={(event) => setMemoryDraft(event.target.value)}
            maxLength={5000}
            placeholder={`Add a note for page ${pageNumber}`}
            className="min-w-48 flex-1 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-3 py-2 text-cv-sm text-[var(--cv-text)]"
          />
          <Button type="submit" variant="outline" disabled={!memoryDraft.trim()}>
            Save page note
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedQuote || selectedQuotePage === null}
            onMouseDown={(event) => event.preventDefault()}
            onClick={saveSelectedQuote}
          >
            {selectedQuotePage !== null && selectedQuotePage !== pageNumber
              ? `Save page ${selectedQuotePage} selection as quote`
              : "Save selection as quote"}
          </Button>
        </form>
      )}
      {searchResults.length > 0 && (
        <div
          aria-label="PDF search results"
          className="flex max-h-28 gap-2 overflow-x-auto border-b border-[var(--cv-border)] bg-[var(--cv-surface)] p-2"
        >
          {searchResults.map((result) => (
            <button
              key={`${result.pageNumber}-${result.matchIndex}`}
              type="button"
              aria-current={activeSearchIndex === result.matchIndex ? "true" : undefined}
              onClick={() => navigateToSearchResult(result)}
              className={`min-w-64 max-w-96 rounded-cv border px-3 py-2 text-left text-cv-xs ${
                activeSearchIndex === result.matchIndex
                  ? "border-[var(--cv-accent-strong)] bg-[var(--cv-accent-muted)]"
                  : "border-[var(--cv-border)]"
              }`}
            >
              <span className="font-semibold text-[var(--cv-text)]">Page {result.pageNumber}</span>
              <span className="mt-1 block text-[var(--cv-text-muted)]">{result.excerpt}</span>
            </button>
          ))}
        </div>
      )}

      {progressWarning && (
        <div
          role="status"
          className="border-b border-[var(--cv-warning)]/40 bg-[var(--cv-warning)]/10 px-4 py-2 text-center text-cv-xs text-[var(--cv-warning)]"
        >
          {progressWarning}
        </div>
      )}

      <div
        ref={viewportRef}
        onPointerDown={(event) => {
          const target = event.target;
          const isTextOrControl =
            target instanceof Element &&
            Boolean(target.closest(".cv-pdf-text-layer, button, input"));
          if (event.pointerType === "touch" && event.isPrimary && !isTextOrControl) {
            touchStartRef.current = { x: event.clientX, y: event.clientY };
          }
        }}
        onPointerUp={(event) => {
          const start = touchStartRef.current;
          touchStartRef.current = null;
          if (!start || event.pointerType !== "touch" || zoom > 1) return;
          const deltaX = event.clientX - start.x;
          const deltaY = event.clientY - start.y;
          if (Math.abs(deltaX) < 56 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
          if (deltaX < 0) {
            if (lastVisiblePage < pageCount) {
              navigatePage(Math.min(pageNumber + (spreadMode ? 2 : 1), pageCount));
            }
          } else {
            navigatePage(Math.max(pageNumber - (spreadMode ? 2 : 1), 1));
          }
        }}
        onPointerCancel={() => {
          touchStartRef.current = null;
        }}
        style={{ touchAction: zoom > 1 ? "auto" : "pan-y pinch-zoom" }}
        className="relative flex min-h-0 flex-1 items-center justify-center gap-4 overflow-auto p-4"
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-[var(--cv-text-muted)]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading PDF locally…
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="m-auto max-w-xl rounded-cv border border-[var(--cv-danger)]/40 bg-[var(--cv-danger)]/10 p-4 text-cv-sm text-[var(--cv-danger)]"
          >
            {error}
          </div>
        )}
        {!isLoading &&
          !error &&
          visiblePageNumbers.map((visiblePageNumber, index) => (
            <div
              key={visiblePageNumber}
              className="relative my-auto shrink-0 shadow-xl"
              role="group"
              aria-label={`PDF page ${visiblePageNumber}`}
            >
              <canvas
                ref={(element) => {
                  canvasRefs.current[index] = element;
                }}
                className="block bg-white"
              />
              <div
                ref={(element) => {
                  textLayerRefs.current[index] = element;
                }}
                className="cv-pdf-text-layer"
                aria-label={`Selectable text on page ${visiblePageNumber}`}
              />
            </div>
          ))}
        {pageCount > 0 && (
          <>
            <button
              type="button"
              aria-label={spreadMode ? "Previous spread" : "Previous page"}
              disabled={pageNumber <= 1}
              onClick={() => navigatePage(Math.max(pageNumber - (spreadMode ? 2 : 1), 1))}
              className="absolute inset-y-0 left-0 z-10 flex w-12 items-center justify-center rounded-r-cv bg-[var(--cv-surface)]/70 text-[var(--cv-text)] disabled:opacity-30 sm:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={spreadMode ? "Next spread" : "Next page"}
              disabled={!canAdvance}
              onClick={() => navigatePage(Math.min(pageNumber + (spreadMode ? 2 : 1), pageCount))}
              className="absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-center rounded-l-cv bg-[var(--cv-surface)]/70 text-[var(--cv-text)] disabled:opacity-30 sm:hidden"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {pageCount > 0 && (
        <footer className="flex items-center gap-3 border-t border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3">
          <span className="min-w-20 text-cv-xs text-[var(--cv-text-muted)]">
            {pageNumber} / {pageCount}
          </span>
          <label className="sr-only" htmlFor="pdf-page-slider">
            PDF page
          </label>
          <input
            id="pdf-page-slider"
            type="range"
            min="1"
            max={pageCount}
            value={pageNumber}
            onChange={(event) => navigatePage(Number(event.target.value))}
            className="min-w-28 flex-1 accent-[var(--cv-accent-strong)]"
          />
          <span className="min-w-16 text-right text-cv-xs text-[var(--cv-text-muted)]">
            {Math.round((pageNumber / pageCount) * 100)}%
          </span>
        </footer>
      )}
    </main>
  );
}
