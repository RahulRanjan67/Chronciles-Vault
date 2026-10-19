import * as React from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns,
  FileText,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Moon,
  Search,
  Sparkles,
  Sun,
  Type,
} from "lucide-react";
import {
  getLocalFileBlob,
  listLocalFiles,
  startReaderSession,
  updateReaderSession,
  endReaderSession,
} from "@grimoire/reader";
import type { LocalFileMetadata } from "@grimoire/reader";
import {
  MemoryType,
  PrivacyState,
  SpoilerLevel,
  type ProgressAnchor,
  type Work,
} from "@grimoire/domain";
import { clientRepository, useLibraryStore } from "@grimoire/state";
import { Button } from "@grimoire/ui";

export interface TxtReaderProps {
  readonly fileId?: string;
  readonly onBack?: () => void;
}

type ReaderTheme = "parchment" | "dark" | "clean";
type FontSize = "sm" | "base" | "lg" | "xl";
type FontFamily = "serif" | "sans" | "mono";

const CHARS_PER_PAGE: Record<FontSize, number> = {
  sm: 1500,
  base: 1100,
  lg: 800,
  xl: 550,
};

function splitTextIntoPages(text: string, fontSize: FontSize): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const paragraphs = normalized.split(/\n\s*\n/);
  const budget = CHARS_PER_PAGE[fontSize];
  const pages: string[] = [];
  let currentPage = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // If a single paragraph is longer than the budget, split it into chunks
    if (trimmed.length > budget) {
      if (currentPage.trim()) {
        pages.push(currentPage.trim());
        currentPage = "";
      }
      // Split by sentence boundaries or word boundaries
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      let chunk = "";
      for (const sentence of sentences) {
        if ((chunk + " " + sentence).length > budget && chunk.trim()) {
          pages.push(chunk.trim());
          chunk = sentence;
        } else {
          chunk = chunk ? chunk + " " + sentence : sentence;
        }
      }
      if (chunk.trim()) {
        pages.push(chunk.trim());
      }
      continue;
    }

    if ((currentPage + "\n\n" + trimmed).length > budget && currentPage.trim()) {
      pages.push(currentPage.trim());
      currentPage = trimmed;
    } else {
      currentPage = currentPage ? currentPage + "\n\n" + trimmed : trimmed;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  return pages.length > 0 ? pages : ["This document is empty."];
}

export function TxtReader({ fileId, onBack }: TxtReaderProps) {
  const library = useLibraryStore();
  const libraryItemsRef = React.useRef(library.items);
  libraryItemsRef.current = library.items;

  const [file, setFile] = React.useState<LocalFileMetadata | null>(null);
  const [rawText, setRawText] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Reader Settings
  const [theme, setTheme] = React.useState<ReaderTheme>("parchment");
  const [fontSize, setFontSize] = React.useState<FontSize>("base");
  const [fontFamily, setFontFamily] = React.useState<FontFamily>("serif");
  const [spreadMode, setSpreadMode] = React.useState<boolean>(true);

  // Pagination & Animation
  const [currentPageIndex, setCurrentPageIndex] = React.useState<number>(0);
  const [pageTurnKey, setPageTurnKey] = React.useState<number>(0);
  const [turnDirection, setTurnDirection] = React.useState<"forward" | "reverse">("forward");

  // Search
  const [showSearch, setShowSearch] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchResults, setSearchResults] = React.useState<number[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = React.useState<number>(0);

  // Memory quote selection
  const [selectedQuote, setSelectedQuote] = React.useState<string>("");
  const [memorySaved, setMemorySaved] = React.useState<boolean>(false);

  // Reading Session
  const [sessionElapsed, setSessionElapsed] = React.useState<number>(0);
  const sessionActiveRef = React.useRef(true);
  const sessionIdRef = React.useRef<string | null>(null);
  const latestAnchorRef = React.useRef<ProgressAnchor | null>(null);

  // Compute pages dynamically from rawText and fontSize
  const pages = React.useMemo(() => {
    if (!rawText) return [];
    return splitTextIntoPages(rawText, fontSize);
  }, [rawText, fontSize]);

  const totalPages = Math.max(1, pages.length);

  // Load File
  React.useEffect(() => {
    if (!fileId) {
      setError("No file specified.");
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const stored = (await listLocalFiles()).find((item) => item.id === fileId);
        if (!stored) throw new Error("This file is no longer on your Local Shelf.");
        if (stored.format !== "txt") throw new Error("This file is not a plain text document.");

        const blob = await getLocalFileBlob(stored.id);
        const text = await blob.text();
        if (cancelled) return;

        setFile(stored);
        setRawText(text);

        // Check if there is an existing anchor
        const work = stored.workId
          ? libraryItemsRef.current.find((item) => item.work.id === stored.workId)
          : undefined;
        const anchor = work?.relationship?.currentAnchor;
        let initialPage = 0;
        if (anchor && anchor.type === "page" && anchor.page) {
          initialPage = Math.max(0, Math.min(anchor.page - 1, 9999));
        }
        setCurrentPageIndex(initialPage);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load TXT file.");
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // Session Tracking
  React.useEffect(() => {
    if (!file) return;
    sessionActiveRef.current = true;
    void startReaderSession(file.id, file.workId, latestAnchorRef.current ?? null)
      .then((session) => {
        if (sessionActiveRef.current) {
          sessionIdRef.current = session.id;
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      if (!sessionActiveRef.current) return;
      setSessionElapsed((prev) => prev + 1);
      if (sessionIdRef.current) {
        const currentAnchor: ProgressAnchor = latestAnchorRef.current ?? {
          type: "page",
          page: currentPageIndex + 1,
          totalPages: Math.max(1, pages.length),
        };
        void updateReaderSession(sessionIdRef.current, currentAnchor);
      }
    }, 1000);

    return () => {
      sessionActiveRef.current = false;
      clearInterval(interval);
      if (sessionIdRef.current) {
        const currentAnchor: ProgressAnchor = latestAnchorRef.current ?? {
          type: "page",
          page: currentPageIndex + 1,
          totalPages: Math.max(1, pages.length),
        };
        void endReaderSession(sessionIdRef.current, currentAnchor);
      }
    };
  }, [file]);

  // Update latest anchor and sync with library when current page changes
  React.useEffect(() => {
    if (!file || pages.length === 0) return;
    const anchor: ProgressAnchor = {
      type: "page",
      page: currentPageIndex + 1,
      totalPages: pages.length,
    };
    latestAnchorRef.current = anchor;

    if (file.workId) {
      try {
        clientRepository.recordProgress(file.workId as any, anchor);
        library.updateRelationship(file.workId as any, { currentAnchor: anchor });
      } catch {
        // Non-fatal
      }
    }
  }, [file, currentPageIndex, pages.length, library]);

  // Navigation handlers with page turn animation
  const step = spreadMode ? 2 : 1;

  const navigateToPage = React.useCallback(
    (target: number, direction?: "forward" | "reverse") => {
      const clamped = Math.max(0, Math.min(target, totalPages - 1));
      if (clamped === currentPageIndex) return;

      const dir = direction ?? (clamped > currentPageIndex ? "forward" : "reverse");
      setTurnDirection(dir);
      setPageTurnKey((k) => k + 1);
      setCurrentPageIndex(clamped);
      setSelectedQuote("");
      setMemorySaved(false);
    },
    [currentPageIndex, totalPages],
  );

  const goNext = React.useCallback(() => {
    if (currentPageIndex + step < totalPages) {
      navigateToPage(currentPageIndex + step, "forward");
    }
  }, [currentPageIndex, step, totalPages, navigateToPage]);

  const goPrev = React.useCallback(() => {
    if (currentPageIndex > 0) {
      navigateToPage(Math.max(0, currentPageIndex - step), "reverse");
    }
  }, [currentPageIndex, step, navigateToPage]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Home") {
        e.preventDefault();
        navigateToPage(0, "reverse");
      } else if (e.key === "End") {
        e.preventDefault();
        navigateToPage(totalPages - 1, "forward");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, navigateToPage, totalPages]);

  // Search logic
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || pages.length === 0) {
      setSearchResults([]);
      setActiveSearchIndex(0);
      return;
    }
    const lower = query.toLowerCase();
    const matches: number[] = [];
    pages.forEach((pageContent, idx) => {
      if (pageContent.toLowerCase().includes(lower)) {
        matches.push(idx);
      }
    });
    setSearchResults(matches);
    setActiveSearchIndex(0);
    if (matches.length > 0) {
      navigateToPage(matches[0]!);
    }
  };

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (activeSearchIndex + 1) % searchResults.length;
    setActiveSearchIndex(nextIdx);
    navigateToPage(searchResults[nextIdx]!);
  };

  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (activeSearchIndex - 1 + searchResults.length) % searchResults.length;
    setActiveSearchIndex(prevIdx);
    navigateToPage(searchResults[prevIdx]!);
  };

  // Selection quote capture
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedQuote(selection.toString().trim());
      setMemorySaved(false);
    }
  };

  const handleSaveQuoteMemory = () => {
    if (!selectedQuote || !file?.workId) return;
    try {
      clientRepository.addMemory(file.workId as any, {
        type: MemoryType.Quote,
        title: `Quote from Page ${currentPageIndex + 1}`,
        body: selectedQuote,
        progressAnchor: latestAnchorRef.current ?? null,
        privacyState: PrivacyState.Public,
        spoilerLevel: SpoilerLevel.SpoilerFree,
        showInGlobalGallery: true,
        accessPathId: null,
        tags: ["Quote", "Local Shelf TXT"],
      });
      setMemorySaved(true);
    } catch {
      // Non-fatal
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[32rem] flex-col items-center justify-center gap-3 text-[var(--gm-text-muted)]">
        <LoaderCircle className="h-6 w-6 animate-spin text-[var(--gm-accent-strong)]" />
        <p className="text-gm-sm font-serif">Binding pages into two-page grimoire…</p>
      </main>
    );
  }

  if (error || !file) {
    return (
      <main className="flex min-h-[32rem] flex-col items-center justify-center gap-4 p-8 text-center">
        <p role="alert" className="max-w-xl text-gm-sm text-[var(--gm-danger)]">
          {error ?? "Unable to open document."}
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to Local Shelf
        </Button>
      </main>
    );
  }

  // Theme styles
  const themeStyles = {
    parchment: {
      bg: "bg-[#f5eedb] text-[#2c2416] border-[#d8ccaf]",
      bookContainer: "bg-[#2b1810] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[#3d2317]",
      pageBg: "bg-[#fbf4e2] text-[#2c2416] border-[#e2d5b8]",
      pageBorder: "border-[#e0d2b4]",
      headerFooterText: "text-[#8c7b64]",
      gutterShadow: "from-black/15 to-transparent",
      spine: "bg-gradient-to-r from-[#201008] via-[#4d2f1f] to-[#201008]",
    },
    dark: {
      bg: "bg-[#101012] text-[#e4e4e7] border-[#27272a]",
      bookContainer: "bg-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.7)] border-[#1f1f23]",
      pageBg: "bg-[#18181b] text-[#e4e4e7] border-[#27272a]",
      pageBorder: "border-[#27272a]",
      headerFooterText: "text-[#71717a]",
      gutterShadow: "from-black/40 to-transparent",
      spine: "bg-gradient-to-r from-[#000000] via-[#27272a] to-[#000000]",
    },
    clean: {
      bg: "bg-[#f8f9fa] text-[#1a1a1a] border-[#e2e8f0]",
      bookContainer: "bg-[#334155] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[#1e293b]",
      pageBg: "bg-[#ffffff] text-[#1a1a1a] border-[#e2e8f0]",
      pageBorder: "border-[#e2e8f0]",
      headerFooterText: "text-[#64748b]",
      gutterShadow: "from-black/10 to-transparent",
      spine: "bg-gradient-to-r from-[#1e293b] via-[#475569] to-[#1e293b]",
    },
  }[theme];

  const fontSizes = {
    sm: "text-[13px] leading-relaxed",
    base: "text-[15px] leading-relaxed",
    lg: "text-[17px] leading-relaxed",
    xl: "text-[19px] leading-loose",
  }[fontSize];

  const fontFamilies = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
  }[fontFamily];

  // Pages to display in spread mode
  const leftPageIndex = spreadMode ? Math.floor(currentPageIndex / 2) * 2 : currentPageIndex;
  const rightPageIndex = spreadMode ? leftPageIndex + 1 : -1;

  const leftPageContent = pages[leftPageIndex] ?? "";
  const rightPageContent = rightPageIndex >= 0 && rightPageIndex < totalPages ? pages[rightPageIndex] ?? "" : "";

  const animationClass = turnDirection === "reverse" ? "gm-page-turn-reverse" : "gm-page-turn-active";

  return (
    <div className={`flex flex-col h-[calc(100vh-3.5rem)] min-h-[500px] w-full select-text ${theme === "dark" ? "bg-[#0c0c0e]" : "bg-[#ece5d4]"}`}>
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-2 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 h-8 px-2.5">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Shelf</span>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-[var(--gm-accent-strong)] shrink-0" />
            <h1 className="text-gm-xs font-semibold truncate max-w-[200px] sm:max-w-xs text-[var(--gm-text)]">
              {file.displayName}
            </h1>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Spread Mode Toggle */}
          <Button
            variant={spreadMode ? "default" : "outline"}
            size="sm"
            onClick={() => setSpreadMode(!spreadMode)}
            className="h-8 px-2.5 text-gm-xs gap-1"
            title={spreadMode ? "Switch to Single Page" : "Switch to 2-Page Book Spread"}
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{spreadMode ? "2-Page Book" : "Single Page"}</span>
          </Button>

          {/* Theme Selector */}
          <div className="flex items-center rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] p-0.5">
            <button
              type="button"
              onClick={() => setTheme("parchment")}
              className={`rounded-cv px-2 py-1 text-[11px] font-medium transition-colors ${theme === "parchment" ? "bg-[#d8ccaf] text-[#2c2416] font-bold" : "text-[var(--gm-text-muted)]"}`}
              title="Parchment Paper"
            >
              Parchment
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-cv px-2 py-1 text-[11px] font-medium transition-colors ${theme === "dark" ? "bg-[#27272a] text-white font-bold" : "text-[var(--gm-text-muted)]"}`}
              title="Dark Sanctum"
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("clean")}
              className={`rounded-cv px-2 py-1 text-[11px] font-medium transition-colors ${theme === "clean" ? "bg-[#e2e8f0] text-black font-bold" : "text-[var(--gm-text-muted)]"}`}
              title="Clean White"
            >
              Clean
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-gm-xs font-serif"
              disabled={fontSize === "sm"}
              onClick={() => {
                if (fontSize === "xl") setFontSize("lg");
                else if (fontSize === "lg") setFontSize("base");
                else if (fontSize === "base") setFontSize("sm");
              }}
              title="Smaller Text"
            >
              A-
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-gm-xs font-serif font-bold"
              disabled={fontSize === "xl"}
              onClick={() => {
                if (fontSize === "sm") setFontSize("base");
                else if (fontSize === "base") setFontSize("lg");
                else if (fontSize === "lg") setFontSize("xl");
              }}
              title="Larger Text"
            >
              A+
            </Button>
          </div>

          {/* Search Toggle */}
          <Button
            variant={showSearch ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="h-8 px-2 text-gm-xs"
            title="Search text"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Search Bar Drawer */}
      {showSearch && (
        <div className="flex items-center gap-2 border-b border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-2 z-10 shrink-0">
          <Search className="h-4 w-4 text-[var(--gm-text-muted)] shrink-0" />
          <input
            type="search"
            placeholder="Search text in document…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 flex-1 bg-[var(--gm-bg)] px-3 text-gm-xs rounded-cv border border-[var(--gm-border)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)] text-[var(--gm-text)]"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2 text-gm-xs text-[var(--gm-text-muted)]">
              <span>
                {activeSearchIndex + 1} of {searchResults.length}
              </span>
              <Button variant="ghost" size="sm" onClick={prevSearchResult} className="h-7 px-1.5">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={nextSearchResult} className="h-7 px-1.5">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <span className="text-gm-xs text-[var(--gm-text-muted)]">No matches</span>
          )}
        </div>
      )}

      {/* Main Book Reader Arena */}
      <main
        className="flex-1 min-h-0 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        onMouseUp={handleTextSelection}
      >
        {/* Previous page side trigger button */}
        <button
          type="button"
          onClick={goPrev}
          disabled={currentPageIndex <= 0}
          aria-label="Previous Page"
          className="absolute left-2 sm:left-4 z-20 flex h-12 w-10 sm:h-16 sm:w-12 items-center justify-center rounded-cv bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Next page side trigger button */}
        <button
          type="button"
          onClick={goNext}
          disabled={currentPageIndex + step >= totalPages}
          aria-label="Next Page"
          className="absolute right-2 sm:right-4 z-20 flex h-12 w-10 sm:h-16 sm:w-12 items-center justify-center rounded-cv bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Physical Book Container */}
        <div
          className={`relative flex h-full max-h-[820px] w-full max-w-5xl rounded-gm-lg border-4 ${themeStyles.bookContainer} overflow-hidden`}
          style={{ perspective: "1600px" }}
        >
          {/* TWO-PAGE SPREAD MODE */}
          {spreadMode ? (
            <div
              key={`spread-${leftPageIndex}-${pageTurnKey}`}
              className={`flex h-full w-full ${animationClass}`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* LEFT PAGE */}
              <div
                className={`relative flex flex-1 flex-col justify-between border-r ${themeStyles.pageBg} ${themeStyles.pageBorder} p-6 sm:p-10 select-text overflow-hidden`}
              >
                {/* Right edge inner shadow (gutter fold) */}
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l ${themeStyles.gutterShadow}`}
                />

                {/* Left Page Header */}
                <div className={`flex items-center justify-between text-[11px] font-mono tracking-wider ${themeStyles.headerFooterText} border-b pb-2 ${themeStyles.pageBorder}`}>
                  <span className="truncate max-w-[200px]">{file.displayName}</span>
                  <span>SANCTUM ARCHIVE</span>
                </div>

                {/* Left Page Text Content */}
                <div className={`my-auto flex-1 py-4 overflow-y-auto ${fontFamilies} ${fontSizes} space-y-4`}>
                  {leftPageContent.split("\n\n").map((para, i) => (
                    <p key={i} className="indent-6 text-justify">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Left Page Footer */}
                <div className={`flex items-center justify-between text-[11px] font-mono ${themeStyles.headerFooterText} border-t pt-2 ${themeStyles.pageBorder}`}>
                  <span>{leftPageIndex + 1}</span>
                  <span className="text-[10px] uppercase tracking-widest">Left Page</span>
                </div>
              </div>

              {/* BOOK SPINE CENTER DIVIDER */}
              <div className={`w-3 sm:w-4 ${themeStyles.spine} shadow-[inset_0_0_8px_rgba(0,0,0,0.6)] shrink-0 relative z-10`} />

              {/* RIGHT PAGE */}
              <div
                className={`relative flex flex-1 flex-col justify-between ${themeStyles.pageBg} p-6 sm:p-10 select-text overflow-hidden`}
              >
                {/* Left edge inner shadow (gutter fold) */}
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r ${themeStyles.gutterShadow}`}
                />

                {/* Right Page Header */}
                <div className={`flex items-center justify-between text-[11px] font-mono tracking-wider ${themeStyles.headerFooterText} border-b pb-2 ${themeStyles.pageBorder}`}>
                  <span>PROGRESS</span>
                  <span>{Math.round(((Math.min(rightPageIndex >= 0 ? rightPageIndex + 1 : leftPageIndex + 1, totalPages)) / totalPages) * 100)}%</span>
                </div>

                {/* Right Page Text Content */}
                <div className={`my-auto flex-1 py-4 overflow-y-auto ${fontFamilies} ${fontSizes} space-y-4`}>
                  {rightPageContent ? (
                    rightPageContent.split("\n\n").map((para, i) => (
                      <p key={i} className="indent-6 text-justify">
                        {para}
                      </p>
                    ))
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center text-gm-xs opacity-40 font-mono">
                      <BookOpen className="h-8 w-8 mb-2" />
                      <p>— End of Volume —</p>
                    </div>
                  )}
                </div>

                {/* Right Page Footer */}
                <div className={`flex items-center justify-between text-[11px] font-mono ${themeStyles.headerFooterText} border-t pt-2 ${themeStyles.pageBorder}`}>
                  <span className="text-[10px] uppercase tracking-widest">Right Page</span>
                  <span>{rightPageIndex >= 0 ? rightPageIndex + 1 : totalPages}</span>
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE PAGE MODE */
            <div
              key={`single-${currentPageIndex}-${pageTurnKey}`}
              className={`flex h-full w-full ${animationClass}`}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={`relative flex flex-1 flex-col justify-between ${themeStyles.pageBg} p-6 sm:p-12 select-text overflow-hidden`}
              >
                {/* Single Page Header */}
                <div className={`flex items-center justify-between text-[11px] font-mono tracking-wider ${themeStyles.headerFooterText} border-b pb-2 ${themeStyles.pageBorder}`}>
                  <span className="truncate max-w-[250px]">{file.displayName}</span>
                  <span>{Math.round(((currentPageIndex + 1) / totalPages) * 100)}%</span>
                </div>

                {/* Single Page Text Content */}
                <div className={`my-auto flex-1 py-6 overflow-y-auto ${fontFamilies} ${fontSizes} max-w-2xl mx-auto w-full space-y-4`}>
                  {pages[currentPageIndex]?.split("\n\n").map((para, i) => (
                    <p key={i} className="indent-8 text-justify">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Single Page Footer */}
                <div className={`flex items-center justify-between text-[11px] font-mono ${themeStyles.headerFooterText} border-t pt-2 ${themeStyles.pageBorder}`}>
                  <span>Page {currentPageIndex + 1} of {totalPages}</span>
                  <span className="text-[10px] uppercase tracking-widest">Grimoire</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Quote Memory Capture Popover */}
        {selectedQuote && file.workId && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] rounded-cv border-2 border-[var(--gm-accent-strong)] bg-[var(--gm-surface)] p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-gm-xs font-semibold text-[var(--gm-accent-strong)] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Capture Quote Memory
              </span>
              <button
                type="button"
                onClick={() => setSelectedQuote("")}
                className="text-gm-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-gm-xs italic text-[var(--gm-text)] line-clamp-2 font-serif bg-[var(--gm-bg)] p-2 rounded-cv mb-2 border border-[var(--gm-border)]">
              &ldquo;{selectedQuote}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--gm-text-muted)]">
                Page {currentPageIndex + 1}
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveQuoteMemory}
                disabled={memorySaved}
                className="h-7 text-gm-xs gap-1"
              >
                {memorySaved ? "Saved to Memories ✓" : "Save Quote"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Bar with Scrubber & Page Indicator */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-2 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={currentPageIndex <= 0}
            className="h-8 px-2 text-gm-xs gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev Page</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={currentPageIndex + step >= totalPages}
            className="h-8 px-2 text-gm-xs gap-1"
          >
            <span className="hidden sm:inline">Next Page</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Progress Slider */}
        <div className="flex-1 max-w-md mx-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={totalPages - 1}
            value={currentPageIndex}
            onChange={(e) => navigateToPage(Number(e.target.value))}
            className="w-full accent-[var(--gm-accent-strong)] cursor-pointer"
          />
        </div>

        {/* Page / Progress Indicator */}
        <div className="flex items-center gap-3 text-gm-xs font-mono text-[var(--gm-text-muted)]">
          <span>
            {spreadMode
              ? `Spreads ${leftPageIndex + 1}-${Math.min(rightPageIndex >= 0 ? rightPageIndex + 1 : leftPageIndex + 1, totalPages)} / ${totalPages}`
              : `Page ${currentPageIndex + 1} of ${totalPages}`}
          </span>
          <span className="hidden sm:inline">
            ({Math.round(((currentPageIndex + 1) / totalPages) * 100)}%)
          </span>
        </div>
      </footer>
    </div>
  );
}
