# Chronicles Vault — Product Document

## 1. Product Thesis

Chronicles Vault is a **local-first, privacy-respecting reading intelligence system**.

The central belief: *your reading life is deeply personal, irreplaceable intellectual capital*. It should live on your device, encrypted by you, searchable by you, and never monetized by anyone. Every book you finish, every highlight you make, every connection you draw between ideas — these are yours.

Chronicles Vault unifies the fragmented reading life of a serious reader. You may read ebooks on Kindle, physical books from the library, manga on a subscription service, papers in a PDF reader, and articles in a browser. Today, your progress, highlights, and memories scatter across a dozen proprietary silos. Chronicles Vault is the single place where all of that comes together.

---

## 2. Core Loop

```
Discover → Add to Library → Read (or track reading) → Capture Memories → Reflect → Connect
```

1. **Discover** — Find a work via search, ISBN scan, provider browse, or browser extension capture
2. **Add** — Work is added to the library with metadata, cover art, and an AccessPath (where to read it)
3. **Read** — Open the built-in reader (EPUB, PDF, CBZ) or mark progress manually for external reads
4. **Capture** — Highlight passages, write notes, save quotes, tag insights as memories
5. **Reflect** — Review reading history, memory timeline, progress charts
6. **Connect** — Surface relationships between works (same author, same series, shared themes, cited by)

---

## 3. Core Principles

| Principle | What It Means |
|---|---|
| **Local first** | All data lives in a SQLite database on the user's device. No account required. |
| **Vault-protected** | Sensitive data (memories, highlights, reading patterns) encrypted with AES-256-GCM + Argon2id. User-controlled unlock. |
| **Provider-neutral** | Tracks books regardless of where they were purchased. Provider adapters surface availability. |
| **Format-agnostic** | Reads EPUB, PDF, CBZ/CBR natively. Tracks any format externally. |
| **Private by default** | No telemetry, no crash reporting without explicit consent, no remote sync unless user configures it. |
| **Extensible** | Browser extension, API, plugin system planned for future expansion. |

---

## 4. Non-Goals (v1.0)

These features are **explicitly out of scope** for the initial release:

- Social features (following friends, shared shelves, public reviews)
- Cloud sync (files stay local; user may self-host in future)
- DRM removal or circumvention of any kind
- Audio books (future v2 feature)
- Video courses or podcasts
- Real-time collaborative annotation
- Selling or recommending books (no affiliate links, no marketplace)
- Replacing dedicated e-ink reading devices (Vault is desktop/laptop focused)

---

## 5. Target User Profiles

### Primary: The Avid Reader
- Reads 30–100+ books/year across fiction and non-fiction
- Frustrated that Goodreads is slow and privacy-invasive
- Has partially finished several reading tracker spreadsheets
- Values: clean UI, fast search, offline access, data ownership

### Secondary: The Scholar/Researcher
- Reads 200+ academic papers/year alongside books
- Needs to connect ideas across sources (citations, themes)
- Values: robust tagging, memory capture, full-text search, export

### Tertiary: The Manga/Comics Reader
- Reads series with 100+ volumes
- Tracks volume/chapter progress across multiple series
- Values: series management, chapter-level progress, cover art display

---

## 6. User Stories

### Library Management

| ID | Story | Priority |
|---|---|---|
| L-01 | As a reader, I can search for a book by title, author, or ISBN and add it to my library in under 3 seconds | P0 |
| L-02 | As a reader, I can see all my books with cover art, reading status, and progress in a grid or list view | P0 |
| L-03 | As a reader, I can organize books into custom shelves (e.g., "To Read", "Favorites", "Reading Now") | P0 |
| L-04 | As a reader, I can import my Goodreads export CSV to populate my library | P1 |
| L-05 | As a reader, I can scan an ISBN barcode (mobile future) or type it to quickly add physical books | P1 |
| L-06 | As a reader, I can bulk-edit book statuses, shelves, and ratings | P2 |
| L-07 | As a reader, I can set reading goals (books per year, pages per day) and see progress | P2 |
| L-08 | As a reader, I can mark a book as "abandoned" with a reason and return to it later | P1 |

### Reading & Progress

| ID | Story | Priority |
|---|---|---|
| R-01 | As a reader, I can open EPUB files in the built-in reader with chapter navigation and progress sync | P0 |
| R-02 | As a reader, I can open PDF files in the built-in reader with page-level progress tracking | P0 |
| R-03 | As a reader, I can open CBZ/CBR comics/manga in the built-in reader with page-level progress | P0 |
| R-04 | As a reader, I can manually update my progress (page, percentage, chapter) for books I read externally | P0 |
| R-05 | As a reader, my reading position is saved automatically when I close the reader | P0 |
| R-06 | As a reader, I can see a reading history timeline showing when I read which pages | P1 |
| R-07 | As a reader, I can set reading sessions with start/end times for time-tracking | P1 |
| R-08 | As a reader, I can see estimated time to finish based on my reading speed | P2 |

### Memory & Capture

| ID | Story | Priority |
|---|---|---|
| M-01 | As a reader, I can highlight text in the built-in reader and it is saved as a memory | P0 |
| M-02 | As a reader, I can write a note on any highlight or attach a standalone note to a book | P0 |
| M-03 | As a reader, I can tag memories with custom tags for later retrieval | P0 |
| M-04 | As a reader, I can search all my memories with full-text search | P0 |
| M-05 | As a reader, I can capture a quote, idea, or insight from any webpage via the browser extension | P1 |
| M-06 | As a reader, I can view all memories for a specific book in a timeline view | P1 |
| M-07 | As a reader, I can export my memories to Markdown, CSV, or Obsidian format | P2 |
| M-08 | As a reader, I can link a memory from one book to a related memory in another book | P2 |

### Vault & Security

| ID | Story | Priority |
|---|---|---|
| V-01 | As a reader, I can set up a master password that encrypts all my sensitive data | P0 |
| V-02 | As a reader, I can unlock the vault by entering my password, and it auto-locks after inactivity | P0 |
| V-03 | As a reader, my vault can be unlocked with biometrics (Touch ID, Windows Hello) | P1 |
| V-04 | As a reader, I can change my master password and re-encrypt all vault data | P1 |
| V-05 | As a reader, I can export an encrypted backup of my entire database | P1 |
| V-06 | As a reader, I can see what data is encrypted vs. publicly accessible without unlocking | P2 |

### Search & Discovery

| ID | Story | Priority |
|---|---|---|
| S-01 | As a reader, I can full-text search across my entire library (titles, authors, descriptions) | P0 |
| S-02 | As a reader, I can full-text search across all my memories and highlights | P0 |
| S-03 | As a reader, I can filter search results by status, format, shelf, rating, and date | P1 |
| S-04 | As a reader, I can ask the AI assistant questions about my library and reading ("What are my favorite themes?") | P2 |
| S-05 | As a reader, I can see works related to what I'm reading (same series, same author, same themes) | P2 |

---

## 7. Success Metrics (v1.0)

| Metric | Target |
|---|---|
| App cold start time | < 2s |
| Library search response | < 100ms |
| Memory capture (reader) | < 200ms |
| Vault unlock time | < 500ms |
| Crash-free sessions | > 99.5% |
| First-run to first book added | < 2 minutes |
