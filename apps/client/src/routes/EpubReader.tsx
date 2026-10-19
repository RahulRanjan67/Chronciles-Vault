import * as React from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle, List } from "lucide-react";
import {
  calculateEpubPercentage,
  createEpubCfi,
  EpubBook,
  epubAnchorFromLocator,
  getEpubInitialCfi,
  getLocalFileBlob,
  listLocalFiles,
  parseEpubCfi,
  resolveEpubHref,
  sanitizeEpubXhtml,
  buildEpubFrameHtml,
  inspectCbzImage,
  startReaderSession,
  updateReaderSession,
  endReaderSession,
} from "@grimoire/reader";
import type {
  EpubChapter,
  EpubLocator,
  EpubTocItem,
  LocalFileMetadata,
} from "@grimoire/reader";
import {
  MemoryType,
  PrivacyState,
  SpoilerLevel,
  type ProgressAnchor,
  type Work,
} from "@grimoire/domain";
import { clientRepository, useLibraryStore } from "@grimoire/state";
import { Button } from "@grimoire/ui";

const MAX_CHAPTER_IMAGE_COUNT = 20;
const MAX_CHAPTER_IMAGE_BYTES = 16 * 1024 * 1024;

type ReaderTheme = "dark" | "sepia" | "light" | "amoled";
type ReaderFont = "serif" | "sans-serif" | "system";

interface ReaderSettings {
  readonly fontSize: number;
  readonly margin: number;
  readonly lineHeight: number;
  readonly theme: ReaderTheme;
  readonly font: ReaderFont;
}

interface EpubDocumentState {
  readonly book: EpubBook;
  readonly file: LocalFileMetadata;
  readonly workId: Work["id"] | null;
}

interface EpubReaderProps {
  readonly fileId?: string;
  readonly onBack?: () => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function createReaderCss(settings: ReaderSettings): string {
  const computed = getComputedStyle(document.documentElement);
  const background = computed.getPropertyValue("--gm-bg").trim();
  const elevated = computed.getPropertyValue("--gm-bg-elevated").trim();
  const text = computed.getPropertyValue("--gm-text").trim();
  const muted = computed.getPropertyValue("--gm-text-muted").trim();
  const inverse = computed.getPropertyValue("--gm-text-inverse").trim();
  const warning = computed.getPropertyValue("--gm-warning").trim();
  const palette =
    settings.theme === "light"
      ? { background: text, text: inverse, muted: background }
      : settings.theme === "sepia"
        ? { background: `color-mix(in srgb, ${background} 90%, ${warning})`, text, muted }
        : settings.theme === "amoled"
          ? { background: `color-mix(in srgb, ${background} 50%, ${elevated})`, text, muted }
          : { background, text, muted };
  const font =
    settings.font === "serif"
      ? "serif"
      : settings.font === "sans-serif"
        ? "sans-serif"
        : "system-ui, sans-serif";
  return `:root{color-scheme:${settings.theme === "light" ? "light" : "dark"};--gm-reader-font-size:${settings.fontSize}px;--gm-reader-line-height:${settings.lineHeight};--gm-reader-font-family:${font};--gm-reader-margin:${settings.margin}px;--gm-reader-background:${palette.background};--gm-reader-text:${palette.text};--gm-reader-muted:${palette.muted}}html,body{min-height:100%;margin:0;background:var(--gm-reader-background);color:var(--gm-reader-text)}body{box-sizing:border-box;font-family:var(--gm-reader-font-family);font-size:var(--gm-reader-font-size);line-height:var(--gm-reader-line-height);padding:0 var(--gm-reader-margin);max-width:824px;margin:0 auto}p,span,div,li{color:inherit!important;background-color:transparent!important}img{max-width:100%;height:auto}`;
}

function cfiSteps(body: HTMLElement, target: Node): number[] | null {
  const steps: number[] = [];
  let node: Node | null = target;
  while (node && node !== body) {
    const parent: Node | null = node.parentNode;
    if (!parent) return [];
    const nodeType = node.nodeType;
    const siblings = Array.from(parent.childNodes).filter(
      (sibling) => sibling.nodeType === nodeType,
    );
    const siblingIndex = siblings.indexOf(node as ChildNode);
    if (siblingIndex < 0) return [];
    steps.unshift(nodeType === Node.ELEMENT_NODE ? (siblingIndex + 1) * 2 : siblingIndex * 2 + 1);
    if (steps.length > 100) return null;
    node = parent;
  }
  return node === body ? steps : [];
}

function firstTextNode(body: HTMLElement, start?: Element | null): Text | null {
  const root = start ?? body;
  const walker = (root.ownerDocument ?? document).createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let visited = 0;
  let node = walker.nextNode();
  while (node && visited < 500) {
    visited += 1;
    if (node.textContent?.trim()) return node as Text;
    node = walker.nextNode();
  }
  return null;
}

function createLocator(
  frame: HTMLIFrameElement,
  chapter: EpubChapter,
  totalChapters: number,
): EpubLocator | null {
  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument;
  const body = frameDocument?.body;
  if (!frameWindow || !frameDocument || !body) return null;
  const finder = Reflect.get(frameDocument, "caretRangeFromPoint");
  let range: Range | null = null;
  if (typeof finder === "function") {
    const found = Reflect.apply(finder, frameDocument, [
      3,
      Math.min(48, Math.max(3, frameWindow.innerHeight / 4)),
    ]);
    if (found && typeof found === "object" && "startContainer" in found) {
      range = found as Range;
    }
  }
  if (!range) {
    const element =
      frameDocument.elementFromPoint(3, Math.min(48, Math.max(3, frameWindow.innerHeight / 4))) ??
      body;
    const text = firstTextNode(body, element);
    if (text) {
      range = frameDocument.createRange();
      range.setStart(text, 0);
      range.collapse(true);
    }
  }
  const rangeNode = range?.startContainer ?? null;
  const target =
    rangeNode?.nodeType === Node.TEXT_NODE
      ? rangeNode
      : ((rangeNode ? firstTextNode(body, rangeNode as Element) : null) ??
        rangeNode ??
        firstTextNode(body));
  if (!target) {
    return {
      format: "epub",
      cfi: createEpubCfi(chapter.index, [], 0),
      percentage: calculateEpubPercentage(chapter.index, totalChapters, 0),
      chapterTitle: chapter.title,
      spineIndex: chapter.index,
    };
  }
  const steps = cfiSteps(body, target);
  const offset =
    steps && target.nodeType === Node.TEXT_NODE && range?.startContainer === target
      ? range.startOffset
      : 0;
  const maxScroll = Math.max(
    1,
    frameDocument.documentElement.scrollHeight - frameWindow.innerHeight,
  );
  const chapterProgress = Math.min(Math.max(frameWindow.scrollY / maxScroll, 0), 1);
  return {
    format: "epub",
    cfi: createEpubCfi(chapter.index, steps ?? [], offset),
    percentage: calculateEpubPercentage(chapter.index, totalChapters, chapterProgress),
    chapterTitle: chapter.title,
    spineIndex: chapter.index,
  };
}

function restoreCfi(frame: HTMLIFrameElement, cfi: string): boolean {
  const frameDocument = frame.contentDocument;
  const frameWindow = frame.contentWindow;
  const body = frameDocument?.body;
  if (!frameDocument || !frameWindow || !body) return false;
  let position;
  try {
    position = parseEpubCfi(cfi);
  } catch {
    return false;
  }
  let node: Node = body;
  for (const step of position.steps) {
    const nodeType = step % 2 === 0 ? Node.ELEMENT_NODE : Node.TEXT_NODE;
    const ordinal = nodeType === Node.ELEMENT_NODE ? step / 2 - 1 : (step - 1) / 2;
    const children = Array.from(node.childNodes).filter((child) => child.nodeType === nodeType);
    const child = children[ordinal];
    if (!child) return false;
    node = child;
  }
  const range = frameDocument.createRange();
  if (node.nodeType === Node.TEXT_NODE) {
    range.setStart(node, Math.min(position.characterOffset, node.textContent?.length ?? 0));
    range.collapse(true);
  } else {
    range.selectNodeContents(node);
    range.collapse(true);
  }
  const top = range.getBoundingClientRect().top;
  frameWindow.scrollTo(0, Math.max(0, frameWindow.scrollY + top));
  return true;
}

function findTocTitle(items: readonly EpubTocItem[], spineIndex: number): string | undefined {
  for (const item of items) {
    if (item.spineIndex === spineIndex) return item.title;
    const nested = findTocTitle(item.children, spineIndex);
    if (nested) return nested;
  }
  return undefined;
}

export function EpubReader({ fileId, onBack }: EpubReaderProps) {
  const library = useLibraryStore();
  const libraryItemsRef = React.useRef(library.items);
  libraryItemsRef.current = library.items;
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const loadedChapterRef = React.useRef<EpubChapter | null>(null);
  const latestAnchorRef = React.useRef<ProgressAnchor | null>(null);
  const pendingCfiRef = React.useRef<string | null>(null);
  const pendingFragmentRef = React.useRef<string | null>(null);
  const pendingScrollRatioRef = React.useRef<number | null>(null);
  const imageUrlsRef = React.useRef<string[]>([]);
  const frameCleanupRef = React.useRef<(() => void) | null>(null);
  const saveTimerRef = React.useRef<number | null>(null);
  const [reader, setReader] = React.useState<EpubDocumentState | null>(null);
  const [spineIndex, setSpineIndex] = React.useState(0);
  const [pageTurnKey, setPageTurnKey] = React.useState(0);
  const triggerPageTurn = React.useCallback(() => {
    setPageTurnKey((key) => key + 1);
  }, []);
  const [chapter, setChapter] = React.useState<EpubChapter | null>(null);
  const [frameContent, setFrameContent] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [tocOpen, setTocOpen] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [sessionElapsed, setSessionElapsed] = React.useState(0);
  const [memoryDraft, setMemoryDraft] = React.useState("");
  const [settings, setSettings] = React.useState<ReaderSettings>({
    fontSize: 18,
    margin: 32,
    lineHeight: 1.65,
    theme: "dark",
    font: "serif",
  });

  React.useEffect(() => {
    if (!fileId) {
      setError("A local file was not selected.");
      setIsLoading(false);
      return;
    }
    let disposed = false;
    setIsLoading(true);
    setError(null);
    setWarning(null);
    setReader(null);
    setChapter(null);
    setFrameContent("");
    loadedChapterRef.current = null;
    latestAnchorRef.current = null;
    frameCleanupRef.current?.();
    frameCleanupRef.current = null;
    const load = async () => {
      const file = (await listLocalFiles()).find((item) => item.id === fileId);
      if (!file || file.format !== "epub") {
        throw new Error("This local file is not an EPUB.");
      }
      const book = await EpubBook.open(await getLocalFileBlob(file.id));
      const work = file.workId
        ? libraryItemsRef.current.find((item) => item.work.id === file.workId)
        : undefined;
      const initialCfi = getEpubInitialCfi(work?.relationship?.currentAnchor ?? null);
      let initialSpineIndex = 0;
      if (initialCfi) {
        try {
          const savedPosition = parseEpubCfi(initialCfi);
          if (savedPosition.spineIndex < book.chapterPaths.length) {
            initialSpineIndex = savedPosition.spineIndex;
            pendingCfiRef.current = initialCfi;
          } else {
            pendingCfiRef.current = null;
            setWarning(
              "The saved EPUB chapter no longer exists; the book opened at the beginning.",
            );
          }
        } catch {
          pendingCfiRef.current = null;
          setWarning("The saved EPUB position was invalid; the book opened at the beginning.");
        }
      } else {
        pendingCfiRef.current = null;
      }
      latestAnchorRef.current =
        initialCfi && work?.relationship?.currentAnchor?.type === "epub_locator"
          ? work.relationship.currentAnchor
          : null;
      setSpineIndex(initialSpineIndex);
      setReader({ book, file, workId: work?.work.id ?? null });
      const savedPercent =
        work?.relationship?.currentAnchor?.type === "epub_locator"
          ? (work.relationship.currentAnchor.percent ?? 0)
          : 0;
      setProgress(Number.isFinite(savedPercent) ? Math.min(Math.max(savedPercent, 0), 100) : 0);
      setIsLoading(false);
    };
    void load().catch((loadError: unknown) => {
      if (!disposed) {
        setError(loadError instanceof Error ? loadError.message : "Unable to open this EPUB.");
        setIsLoading(false);
      }
    });
    return () => {
      disposed = true;
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      for (const url of imageUrlsRef.current) URL.revokeObjectURL(url);
      imageUrlsRef.current = [];
    };
  }, [fileId]);

  React.useEffect(() => {
    if (!reader) return;
    const controller = new AbortController();
    let cancelled = false;
    const loadChapter = async () => {
      const loaded = await reader.book.loadChapter(spineIndex, controller.signal);
      const sanitized = sanitizeEpubXhtml(loaded.content);
      const inertDocument = new DOMParser().parseFromString(
        `<html><body>${sanitized}</body></html>`,
        "text/html",
      );
      const images = Array.from(inertDocument.body.querySelectorAll("img"));
      let imageBytes = 0;
      const imageUrls: string[] = [];
      for (const image of images.slice(0, MAX_CHAPTER_IMAGE_COUNT)) {
        const source = image.getAttribute("data-gm-src");
        image.removeAttribute("data-gm-src");
        const resource = source ? resolveEpubHref(loaded.path, source) : null;
        const extension = resource?.path.split(".").pop()?.toLowerCase() ?? "";
        if (!resource || !["jpg", "jpeg", "png", "webp", "avif"].includes(extension)) {
          image.remove();
          continue;
        }
        try {
          const bytes = await reader.book.loadResource(
            resource.path,
            controller.signal,
            MAX_CHAPTER_IMAGE_BYTES - imageBytes,
          );
          imageBytes += bytes.byteLength;
          if (imageBytes > MAX_CHAPTER_IMAGE_BYTES) {
            image.remove();
            continue;
          }
          const imageInfo = inspectCbzImage(bytes, extension);
          const url = URL.createObjectURL(
            new Blob([bytes.buffer as ArrayBuffer], { type: imageInfo.mimeType }),
          );
          imageUrls.push(url);
          image.src = url;
        } catch {
          image.remove();
        }
      }
      for (const image of images.slice(MAX_CHAPTER_IMAGE_COUNT)) image.remove();
      if (cancelled) {
        for (const url of imageUrls) URL.revokeObjectURL(url);
        return;
      }
      for (const url of imageUrlsRef.current) URL.revokeObjectURL(url);
      imageUrlsRef.current = imageUrls;
      loadedChapterRef.current = loaded;
      setChapter(loaded);
      setFrameContent(buildEpubFrameHtml(inertDocument.body.innerHTML, createReaderCss(settings)));
    };
    void loadChapter().catch((loadError: unknown) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : "Unable to render this chapter.");
      }
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reader, spineIndex]);

  const saveCurrentProgress = React.useCallback(() => {
    const frame = frameRef.current;
    const loaded = loadedChapterRef.current;
    if (!reader || !frame || !loaded) return;
    const locator = createLocator(frame, loaded, reader.book.chapterPaths.length);
    if (!locator) return;
    const anchor = epubAnchorFromLocator(locator);
    latestAnchorRef.current = anchor;
    setProgress(locator.percentage);
    if (!reader.workId) return;
    try {
      library.recordProgress(reader.workId, anchor);
      setWarning(null);
    } catch (progressError) {
      setWarning(
        progressError instanceof Error
          ? `Position could not be saved: ${progressError.message}`
          : "Position could not be saved.",
      );
    }
  }, [reader, library.recordProgress]);

  const handleFrameLoad = React.useCallback(() => {
    const frame = frameRef.current;
    const loaded = loadedChapterRef.current;
    if (!frame || !loaded || !reader) return;
    const frameWindow = frame.contentWindow;
    const frameDocument = frame.contentDocument;
    if (!frameWindow || !frameDocument) return;
    applyFrameSettings(frame, settings);
    if (pendingCfiRef.current) {
      try {
        if (parseEpubCfi(pendingCfiRef.current).spineIndex === loaded.index) {
          restoreCfi(frame, pendingCfiRef.current);
        }
      } finally {
        pendingCfiRef.current = null;
      }
    } else if (pendingFragmentRef.current) {
      const fragment = pendingFragmentRef.current;
      const target =
        frameDocument.getElementById(fragment) ??
        frameDocument.getElementById(`user-content-${fragment}`);
      target?.scrollIntoView();
      pendingFragmentRef.current = null;
    } else if (pendingScrollRatioRef.current !== null) {
      const ratio = pendingScrollRatioRef.current;
      frameWindow.scrollTo(0, ratio * frameDocument.documentElement.scrollHeight);
      pendingScrollRatioRef.current = null;
    }
    const onScroll = () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(saveCurrentProgress, 500);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      const closest = target && Reflect.get(target, "closest");
      const element =
        typeof closest === "function"
          ? (Reflect.apply(closest, target, ["a[href]"]) as Element | null)
          : null;
      if (!element) return;
      event.preventDefault();
      const href = element.getAttribute("href") ?? "";
      const resolved = resolveEpubHref(loaded.path, href);
      const targetIndex = resolved ? (reader?.book.chapterPaths.indexOf(resolved.path) ?? -1) : -1;
      if (targetIndex >= 0 && resolved) {
        if (targetIndex === loaded.index) {
          const target = resolved.fragment
            ? (frameDocument.getElementById(resolved.fragment) ??
              frameDocument.getElementById(`user-content-${resolved.fragment}`))
            : null;
          target?.scrollIntoView();
          if (!resolved.fragment) frameWindow.scrollTo(0, 0);
          saveCurrentProgress();
        } else {
          pendingFragmentRef.current = resolved.fragment;
          setSpineIndex(targetIndex);
        }
        return;
      }
      setWarning("External EPUB links are blocked to keep the reader offline.");
    };
    let touchStart: { x: number; y: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStart =
        event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const start = touchStart;
      touchStart = null;
      const touch = event.changedTouches[0];
      if (!start || !touch) return;
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (Math.abs(deltaX) < 56 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      const nextIndex = loaded.index + (deltaX < 0 ? 1 : -1);
      if (nextIndex < 0 || nextIndex >= reader.book.chapterPaths.length) return;
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveCurrentProgress();
      pendingCfiRef.current = null;
      pendingFragmentRef.current = null;
      pendingScrollRatioRef.current = 0;
      setSpineIndex(nextIndex);
    };
    frameDocument.documentElement.style.touchAction = "pan-y pinch-zoom";
    frameWindow.addEventListener("scroll", onScroll, { passive: true });
    frameWindow.addEventListener("touchstart", onTouchStart, { passive: true });
    frameWindow.addEventListener("touchend", onTouchEnd, { passive: true });
    frameDocument.addEventListener("click", onClick, true);
    frameCleanupRef.current?.();
    frameCleanupRef.current = () => {
      frameWindow.removeEventListener("scroll", onScroll);
      frameWindow.removeEventListener("touchstart", onTouchStart);
      frameWindow.removeEventListener("touchend", onTouchEnd);
      frameDocument.removeEventListener("click", onClick, true);
    };
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveCurrentProgress();
  }, [reader, saveCurrentProgress, settings]);

  React.useEffect(() => {
    applyFrameSettings(frameRef.current, settings);
  }, [settings, frameContent]);

  React.useEffect(
    () => () => {
      frameCleanupRef.current?.();
      frameCleanupRef.current = null;
    },
    [],
  );

  React.useEffect(() => {
    const readerSession = reader;
    if (!readerSession) return;
    let cancelled = false;
    let sessionId: string | null = null;
    let startedAt: string | null = null;
    let heartbeatBusy = false;
    let ticks = 0;
    const start = async () => {
      const session = await startReaderSession(
        readerSession.file.id,
        readerSession.file.workId,
        latestAnchorRef.current,
      );
      if (cancelled) {
        await endReaderSession(
          session.id,
          latestAnchorRef.current ?? {
            type: "epub_locator",
            cfi: createEpubCfi(0, [], 0),
          },
        );
        return;
      }
      sessionId = session.id;
      startedAt = session.startedAt;
    };
    void start().catch((sessionError: unknown) => {
      if (!cancelled) {
        setWarning(
          sessionError instanceof Error
            ? `Reading time is not being recorded: ${sessionError.message}`
            : "Reading time is not being recorded.",
        );
      }
    });
    const timer = window.setInterval(() => {
      ticks += 1;
      if (startedAt) setSessionElapsed(Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
      if (!sessionId || ticks % 15 !== 0 || heartbeatBusy) return;
      heartbeatBusy = true;
      void updateReaderSession(
        sessionId,
        latestAnchorRef.current ?? {
          type: "epub_locator",
          cfi: createEpubCfi(0, [], 0),
        },
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
          latestAnchorRef.current ?? { type: "epub_locator", cfi: createEpubCfi(0, [], 0) },
        ).catch(() => {
          if (!cancelled) setWarning("The final reading position could not be saved.");
        });
      }
    };
  }, [reader]);

  const navigateChapter = (nextIndex: number) => {
    if (!reader || nextIndex < 0 || nextIndex >= reader.book.chapterPaths.length) return;
    triggerPageTurn();
    saveCurrentProgress();
    pendingCfiRef.current = null;
    pendingFragmentRef.current = null;
    pendingScrollRatioRef.current = 0;
    setSpineIndex(nextIndex);
  };

  const navigateToToc = (item: EpubTocItem) => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    triggerPageTurn();
    pendingCfiRef.current = null;
    pendingScrollRatioRef.current = null;
    if (item.spineIndex === spineIndex) {
      const frameDocument = frameRef.current?.contentDocument;
      const target = item.fragment
        ? (frameDocument?.getElementById(item.fragment) ??
          frameDocument?.getElementById(`user-content-${item.fragment}`))
        : null;
      target?.scrollIntoView();
      if (!item.fragment) frameRef.current?.contentWindow?.scrollTo(0, 0);
      saveCurrentProgress();
    } else {
      pendingFragmentRef.current = item.fragment;
      setSpineIndex(item.spineIndex);
    }
    setTocOpen(false);
  };

  const navigateToPercentage = (percentage: number) => {
    if (!reader) return;
    triggerPageTurn();
    const total = reader.book.chapterPaths.length;
    const bounded = Math.min(Math.max(percentage, 0), 100);
    const chapterPosition = Math.min(Math.floor((bounded / 100) * total), total - 1);
    const chapterProgress = (bounded / 100) * total - chapterPosition;
    pendingCfiRef.current = null;
    pendingFragmentRef.current = null;
    if (chapterPosition === spineIndex) {
      const frame = frameRef.current;
      const frameDocument = frame?.contentDocument;
      const frameWindow = frame?.contentWindow;
      if (frameDocument && frameWindow) {
        const maxScroll = Math.max(
          0,
          frameDocument.documentElement.scrollHeight - frameWindow.innerHeight,
        );
        frameWindow.scrollTo(0, chapterProgress * maxScroll);
        saveCurrentProgress();
      }
    } else {
      pendingScrollRatioRef.current = chapterProgress;
      setSpineIndex(chapterPosition);
    }
  };

  const renderToc = (items: readonly EpubTocItem[], depth = 0): React.ReactNode =>
    items.map((item) => (
      <React.Fragment key={item.id}>
        <button
          type="button"
          className="block w-full truncate rounded px-2 py-1 text-left text-gm-xs text-[var(--gm-text)] hover:bg-[var(--gm-accent-muted)]"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => navigateToToc(item)}
        >
          {item.title}
        </button>
        {item.children.length > 0 && renderToc(item.children, depth + 1)}
      </React.Fragment>
    ));

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        triggerPageTurn();
        frameRef.current?.contentWindow?.scrollBy(
          0,
          Math.max(1, frameRef.current.contentWindow.innerHeight * 0.85),
        );
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        triggerPageTurn();
        frameRef.current?.contentWindow?.scrollBy(
          0,
          -Math.max(1, frameRef.current.contentWindow.innerHeight * 0.85),
        );
      } else if (event.key.toLowerCase() === "t") {
        setTocOpen((open) => !open);
      } else if (event.key === "Escape") {
        if (tocOpen) setTocOpen(false);
        else onBack?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack, tocOpen]);

  if (isLoading) {
    return (
      <main className="flex min-h-[32rem] items-center justify-center gap-2 text-[var(--gm-text-muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading EPUB locally…
      </main>
    );
  }
  if (error) {
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

  const totalChapters = reader?.book.chapterPaths.length ?? 0;
  const tocTitle = reader ? findTocTitle(reader.book.toc, spineIndex) : undefined;
  const saveMemory = () => {
    if (!reader?.workId || !memoryDraft.trim()) return;
    const linkedWork = library.items.find((item) => item.work.id === reader.workId);
    if (!linkedWork) {
      setWarning("The linked Work is unavailable; this note was not saved.");
      return;
    }
    try {
      const anchor = latestAnchorRef.current;
      if (!anchor) throw new Error("Wait for the EPUB position to finish loading.");
      clientRepository.addMemory(linkedWork.work.id, {
        type: MemoryType.PersonalNote,
        title: chapter?.title ?? `EPUB chapter ${spineIndex + 1}`,
        body: memoryDraft.trim(),
        privacyState: PrivacyState.Private,
        spoilerLevel: SpoilerLevel.SpoilerFree,
        showInGlobalGallery: true,
        accessPathId:
          linkedWork.relationship?.preferredAccessPathId ??
          linkedWork.accessPaths.find((path) => path.isPreferred)?.id ??
          linkedWork.accessPaths[0]?.id ??
          null,
        progressAnchor: anchor,
        assets: [],
        tags: [],
      });
      library.refresh();
      setMemoryDraft("");
      setWarning(null);
    } catch (memoryError) {
      setWarning(
        memoryError instanceof Error
          ? `Page note could not be saved: ${memoryError.message}`
          : "Page note could not be saved.",
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
              {reader?.book.title ?? reader?.file.displayName ?? "EPUB Reader"}
            </h1>
            <p className="truncate text-gm-xs text-[var(--gm-text-muted)]">
              {tocTitle ?? chapter?.title ?? `Chapter ${spineIndex + 1}`} · {Math.round(progress)}%
              · Session {formatDuration(sessionElapsed)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={tocOpen ? "Close table of contents" : "Open table of contents"}
            onClick={() => setTocOpen((open) => !open)}
          >
            <List className="h-4 w-4" />
          </Button>
          <label className="sr-only" htmlFor="epub-font-size">
            Font size
          </label>
          <select
            id="epub-font-size"
            value={settings.fontSize}
            onChange={(event) =>
              setSettings((current) => ({ ...current, fontSize: Number(event.target.value) }))
            }
            className="max-w-24 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-2 text-gm-xs text-[var(--gm-text)]"
          >
            {[14, 16, 18, 20, 22, 24, 28, 32].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="epub-margin">
            Page margin
          </label>
          <select
            id="epub-margin"
            value={settings.margin}
            onChange={(event) =>
              setSettings((current) => ({ ...current, margin: Number(event.target.value) }))
            }
            className="max-w-24 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-2 text-gm-xs text-[var(--gm-text)]"
          >
            {[16, 24, 32, 40, 48].map((margin) => (
              <option key={margin} value={margin}>
                Margin {margin}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="epub-line-height">
            Line spacing
          </label>
          <select
            id="epub-line-height"
            value={settings.lineHeight}
            onChange={(event) =>
              setSettings((current) => ({ ...current, lineHeight: Number(event.target.value) }))
            }
            className="max-w-28 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-2 text-gm-xs text-[var(--gm-text)]"
          >
            {[1.4, 1.6, 1.8, 2].map((lineHeight) => (
              <option key={lineHeight} value={lineHeight}>
                Line {lineHeight}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="epub-font">
            Font family
          </label>
          <select
            id="epub-font"
            value={settings.font}
            onChange={(event) =>
              setSettings((current) => ({ ...current, font: event.target.value as ReaderFont }))
            }
            className="max-w-32 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-2 text-gm-xs text-[var(--gm-text)]"
          >
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans</option>
            <option value="system">System</option>
          </select>
          <label className="sr-only" htmlFor="epub-theme">
            Reader theme
          </label>
          <select
            id="epub-theme"
            value={settings.theme}
            onChange={(event) =>
              setSettings((current) => ({ ...current, theme: event.target.value as ReaderTheme }))
            }
            className="max-w-28 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-2 py-2 text-gm-xs text-[var(--gm-text)]"
          >
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
            <option value="light">Light</option>
            <option value="amoled">AMOLED</option>
          </select>
        </div>
      </header>

      {reader && reader.book.toc.length > 0 && tocOpen && (
        <nav
          aria-label="EPUB table of contents"
          className="max-h-48 overflow-auto border-b border-[var(--gm-border)] bg-[var(--gm-surface)] p-2"
        >
          {renderToc(reader.book.toc)}
        </nav>
      )}
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
          <label htmlFor="epub-memory" className="sr-only">
            Note for {chapter?.title ?? `chapter ${spineIndex + 1}`}
          </label>
          <input
            id="epub-memory"
            value={memoryDraft}
            onChange={(event) => setMemoryDraft(event.target.value)}
            maxLength={5000}
            placeholder="Add a note for this chapter"
            className="min-w-48 flex-1 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
          />
          <Button type="submit" variant="outline" disabled={!memoryDraft.trim()}>
            Save chapter note
          </Button>
        </form>
      )}

      <section className="relative min-h-0 flex-1 bg-[var(--gm-bg)] p-2">
        {frameContent && (
          <iframe
            key={`${spineIndex}-${pageTurnKey}`}
            ref={frameRef}
            title={chapter?.title ?? "EPUB chapter"}
            srcDoc={frameContent}
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            onLoad={handleFrameLoad}
            className="h-full w-full border-0 bg-[var(--gm-bg)] gm-page-turn-active"
          />
        )}
        <button
          type="button"
          aria-label="Previous chapter"
          disabled={spineIndex <= 0}
          onClick={() => navigateChapter(spineIndex - 1)}
          className="absolute inset-y-2 left-2 z-10 flex w-10 items-center justify-center rounded-r-cv bg-[var(--gm-surface)]/70 text-[var(--gm-text)] disabled:opacity-30 sm:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next chapter"
          disabled={spineIndex >= totalChapters - 1}
          onClick={() => navigateChapter(spineIndex + 1)}
          className="absolute inset-y-2 right-2 z-10 flex w-10 items-center justify-center rounded-l-cv bg-[var(--gm-surface)]/70 text-[var(--gm-text)] disabled:opacity-30 sm:hidden"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </section>

      <footer className="flex flex-wrap items-center gap-3 border-t border-[var(--gm-border)] bg-[var(--gm-surface)] px-4 py-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous chapter"
          disabled={spineIndex <= 0}
          onClick={() => navigateChapter(spineIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-36 text-center text-gm-xs text-[var(--gm-text-muted)]">
          Chapter {spineIndex + 1} of {totalChapters}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next chapter"
          disabled={spineIndex >= totalChapters - 1}
          onClick={() => navigateChapter(spineIndex + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <label className="sr-only" htmlFor="epub-progress">
          Reading progress
        </label>
        <input
          id="epub-progress"
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={(event) => navigateToPercentage(Number(event.target.value))}
          className="min-w-28 flex-1 accent-[var(--gm-accent-strong)]"
        />
        <span className="min-w-12 text-right text-gm-xs text-[var(--gm-text-muted)]">
          {Math.round(progress)}%
        </span>
      </footer>
    </main>
  );
}

function applyFrameSettings(frame: HTMLIFrameElement | null, settings: ReaderSettings): void {
  if (!frame) return;
  const style = frame.contentDocument?.querySelector("style");
  if (style) style.textContent = createReaderCss(settings);
}
