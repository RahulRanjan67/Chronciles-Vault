# Chronicles Vault — Reader Adapter & Navigation Contract

## 1. Reader System Architecture

The Chronicles Vault reader subsystem provides a unified, distraction-free reading environment across heterogeneous document formats. Regardless of whether the user is opening an EPUB novel, an academic PDF paper, or a comic/manga CBZ archive, the reader presents a consistent toolbar, memory capture interface, bookmark system, and progress persistence bridge.

```
┌────────────────────────────────────────────────────────┐
│                      Reader Shell                      │
│   [Header: Title, TOC, Search, Bookmarks, Close]       │
├────────────────────────────────────────────────────────┤
│                                                        │
│                  Active Format Adapter                 │
│         (EPUB Adapter | PDF Adapter | CBZ Adapter)     │
│                                                        │
├────────────────────────────────────────────────────────┤
│   [Footer: Progress Bar, Page/Chapter Counter, Scrub]   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Progress Locator Specification

Reading positions are tracked via the `ProgressLocator` discriminated union, which is serialized to the `ProgressAnchor` domain object upon saving.

```typescript
export type ProgressLocator =
  | EpubCfiLocator
  | PdfPageLocator
  | ComicPageLocator
  | WebScrollLocator;

export interface EpubCfiLocator {
  readonly format: 'epub';
  readonly cfi: string;              // Canonical Fragment Identifier (e.g. "epubcfi(/6/4[chap01]!/4/2/10)")
  readonly percentage: number;       // 0.00 to 100.00
  readonly chapterTitle?: string;
  readonly spineIndex: number;
}

export interface PdfPageLocator {
  readonly format: 'pdf';
  readonly pageNumber: number;       // 1-indexed
  readonly totalPages: number;
  readonly percentage: number;       // pageNumber / totalPages * 100
  readonly scrollOffsetTop?: number;
}

export interface ComicPageLocator {
  readonly format: 'cbz' | 'cbr';
  readonly pageIndex: number;        // 0-indexed entry in zip
  readonly totalPages: number;
  readonly pageFileName: string;     // e.g. "042.jpg"
  readonly readingDirection: 'ltr' | 'rtl' | 'vertical_webtoon';
}

export interface WebScrollLocator {
  readonly format: 'web';
  readonly scrollY: number;
  readonly documentHeight: number;
  readonly percentage: number;
}
```

---

## 3. ReaderAdapter Interface

Format engines implement `ReaderAdapter` to bind to DOM container nodes and communicate with the vault state:

```typescript
import { Result } from '@chronicles-vault/shared';
import { ProgressLocator } from './progress-locator';

export interface ReaderViewport {
  readonly container: HTMLElement;
  readonly width: number;
  readonly height: number;
}

export interface ReaderSettings {
  readonly fontSizePx: number;        // Default: 18
  readonly fontFamily: string;        // 'serif' | 'sans-serif' | 'system'
  readonly lineSpacing: number;       // Default: 1.6
  readonly theme: 'dark' | 'sepia' | 'light' | 'amoled';
  readonly readingDirection?: 'ltr' | 'rtl' | 'vertical';
  readonly fitMode?: 'fit-width' | 'fit-height' | 'fit-page' | 'original';
}

export interface SearchMatch {
  readonly excerpt: string;
  readonly locator: ProgressLocator;
  readonly matchIndex: number;
}

export interface ReaderAdapter {
  readonly format: 'epub' | 'pdf' | 'cbz' | 'cbr';

  /** Mount document into the DOM container */
  load(container: HTMLElement, fileBlob: Blob | ArrayBuffer, initialPosition?: ProgressLocator): Promise<Result<void, Error>>;

  /** Tear down views, abort canvas rendering, release memory buffers */
  unload(): Promise<void>;

  /** Jump to a specific locator */
  navigateTo(locator: ProgressLocator): Promise<void>;

  /** Get exact current locator */
  getCurrentPosition(): ProgressLocator;

  /** Update reader presentation settings */
  applySettings(settings: ReaderSettings): void;

  /** Execute in-document text search */
  search(query: string): Promise<readonly SearchMatch[]>;

  /** Table of Contents tree */
  getToc(): Promise<readonly TocItem[]>;
}

export interface TocItem {
  readonly id: string;
  readonly title: string;
  readonly locator: ProgressLocator;
  readonly children?: readonly TocItem[];
}
```

---

## 4. Format-Specific Implementations

### 4.1 EPUB (Reflowable & Fixed Layout)
- **Engine**: Custom integration with `epub.js` or `foliate-js`.
- **Reflow Engine**: Automatically calculates page spreads based on container width.
- **Themes**: Injects scoped CSS variables matching `--cv-bg` and `--cv-text` for seamless dark-mode integration without breaking embedded book typography.
- **CFI Persistence**: Emits a `reading:progress_updated` event every 5 seconds of idle reading or upon explicit page turn.

### 4.2 PDF (Documents & Academic Papers)
- **Engine**: Mozilla `pdf.js` via Web Worker threads.
- **Rendering**: Canvas rendered at `window.devicePixelRatio` for sharp text on Retina / High-DPI screens.
- **Text Layer**: Transparent HTML text layer positioned over canvas to enable native mouse text selection, searching, and quote grabbing.
- **Fit Modes**:
  - `fit-width`: Stretches page width to fill window horizontally (optimal for papers).
  - `fit-page`: Keeps entire single page inside visible viewport.
  - `spread`: Two-page side-by-side view for widescreen displays.

### 4.3 CBZ / CBR (Comics & Manga)
- **Engine**: WebAssembly uncompressed ZIP / TAR unpacker streaming directly to `<canvas>` or `ImageBitmap`.
- **Reading Directions**:
  - **Manga Mode (Right-to-Left)**: Left arrow advances forward, right arrow moves backward.
  - **Western Comic (Left-to-Right)**: Standard left-to-right page flipping.
  - **Webtoon Mode (Vertical Continuous)**: Infinite continuous vertical scroll with virtualized off-screen image unmounting to maintain 60 FPS on 100+ page chapters.

---

## 5. In-Reader Memory & Highlight Capture Flow

1. **Selection Event**: User selects text with mouse or keyboard within the reader viewport.
2. **Floating Action Menu**: A compact popover appears directly above the selection containing:
   - `[Highlight]` (Yellow, Cyan, Emerald, Violet)
   - `[Capture Quote]` (Creates memory modal with quote pre-filled)
   - `[Add Note]` (Opens drawer with focus in markdown editor)
   - `[Copy Text]`
3. **Storage & Anchoring**:
   - The selected text, bounding DOM rectangle, and current `ProgressLocator` are packaged into a `Memory` entity (`type = 'quote'`).
   - The highlight is rendered persistently across page reloads via EPUB CFIRange or PDF page quad-coordinates.

---

## 6. Keyboard Navigation Contract

| Key Combination | Action |
|---|---|
| `Right Arrow` / `Page Down` | Next page / advance forward |
| `Left Arrow` / `Page Up` | Previous page / move backward |
| `Space` | Scroll down one viewport / advance page |
| `Shift + Space` | Scroll up one viewport |
| `J` / `K` | Smooth scroll down / up (continuous modes) |
| `F` / `Ctrl + F` / `Cmd + F` | Open in-document search bar |
| `B` | Toggle bookmark at current location |
| `H` | Instant highlight current selection |
| `T` | Open Table of Contents drawer |
| `Esc` | Close drawers / exit full-screen reader |
