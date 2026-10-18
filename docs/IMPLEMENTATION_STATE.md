# Chronicles Vault — Verified Implementation State

This snapshot replaces the stale Cycle 0-era subsystem matrix. Cycle-level
progress follows `IMPLEMENTATION_PLAN.md`; feature status below is limited to
work implemented and checked in the current project folder.

## Cycle Progress

| Cycle       | Scope                                       |           Status            | Current evidence                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------- | :-------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cycle 0     | Foundations and shared contracts            | Complete per canonical plan | The plan records the foundation and package verification results.                                                                                                                                                                                   |
| Cycle 1     | Core Library and Return Desk                | Complete per canonical plan | Work, Library, Work Detail, and Return Desk implementation is recorded complete in the plan.                                                                                                                                                        |
| Cycle 2     | Radar and Browser Tab Ingestion             |          Complete           | Browser extension companion (Chromium MV3 + Firefox), BrowserAdapter abstraction, offline staging queue, JSON batch handoff, and Radar intake UI (/radar) with triage cards and match suggestions verified.                                         |
| Cycle 3     | Local Shelf and Reader                      |          Complete           | Browser-local staging, holding shelf, Work linking, EPUB/PDF/CBZ sandboxed readers with exact CFI/page resume, double-page spread, mobile swipe/tap controls, and reading session tracking verified.                                              |
| Cycle 4     | Memory Studio and Global Gallery            |          Complete           | Reader-context capture, local image assets, spoiler-safe capture/gallery, and the searchable virtualized gallery with lazy thumbnail previews are implemented and verified.                                                                         |
| Cycle 5     | Memory Refresher Drawer and Return Engine   |          Complete           | All six explainable return signals and the spoiler-safe refresher are implemented; local AccessPaths resume in the linked reader and unavailable/non-local paths fall back to Work details.                                                         |
| Cycle 6     | Private Vault Security Boundary             |          Complete           | Argon2id/AES-GCM key lifecycle, encrypted IndexedDB storage, reactive lock/unlock, private note search, public-storage guards, and auto-lock are implemented and checked below.                                                                     |
| Cycle 7     | Updates Engine and Source Health Resilience |          Complete           | Work resilience when all access paths deleted, cancellable HealthScheduler (backoff, jitter, 304 validators, auto-polling suspension after 5 failures), WorkDetail source controls, and 183 monorepo tests passing.                                |
| Cycle 8     | Integration Adapters and Legality Rules     |          Complete           | ProviderAdapter architecture, AniList GraphQL metadata adapter, PublicFeed RSS/Atom adapter, ManualWeb fallback adapter, ProviderRegistry, non-bypass security guardrails, disconnect protection, and 15 source package tests passing.            |
| Cycle 9     | Archive, Duplicate Merging & Work Relations |          Complete           | Domain archive reasons, duplicate candidate detection engine, non-destructive merge engine, work relation graph, UI modals, and 245 passing monorepo tests.                                                            |
| Cycle 10    | Search and Command Palette                  |          Complete           | Global search engine (privacy-enforcing + `readingAttemptId` aware), palette UI with grouped results and quick actions, header search bar wired to open Command Palette, warm/violet/rose theme-reactive cover fallback gradients, Discover placeholder route, and dev-only vault demo data verified. |
| Cycle 11    | Lists and Publications                      |          Complete           | Personal list ordering, item notes, list editing, and a privacy-gated publication engine (`reread_attempt_leak` aware) with Stripe Press / Lando Norris inspired editorial & telemetry HTML/Markdown export and live 1–10 score bar verified. |
| Cycle 12    | Import / Export Engine                      |          Complete           | JSON/CSV/Markdown/ZIP export, vault-export confirmation gate, JSON/CSV/bookmark import with preview and duplicate-check, zero `as WorkId` casts, full personal list restoration (`listsRestored`), and 100% fidelity roundtrip tests (`transfer-roundtrip.test.ts`) passing. |
| Cycle 13    | 500-Work Performance Benchmark & Lite Profile |          Complete           | 500-work SQLite + FTS5 + WebCrypto benchmark suite (`packages/database/src/__tests__/benchmark-500.test.ts`) and 500-work client filter/search benchmark (`packages/state/tests/benchmark-500.test.ts`) passing; viewport row virtualization in `VirtualWorkGrid.tsx`; `usePerformanceProfile` (Auto/Full/Balanced/Lite) wired into `AppShell`, CSS tokens, and `Settings`; route `React.lazy` code-splitting in `App.tsx`. |
| Cycle 13.5  | Repository Unification & Quality-of-Life Hardening |          Complete           | ADR-010 repository interfaces & `browserRepository` adapter, real unread updates count + Mark All Seen + Snooze/Dismiss, optional Work metadata fields & editor (`WorkCreator[]`, `rating`, chapter/volume/page counts, dates, original title/language, content warnings/rating), `ShelfPriorityTier` (`highlight`, `priority_watch`), local video file reference linking, Reading Queue ("Next Up", `useReadingQueueStore`), `readingAttemptId` on memories, bulk Library operations, mobile filter bottom sheet (`LibraryFilters.tsx`), and 38-test verification suite (`cycle-13-5.test.ts`) passing. |
| Cycle 14    | Cross-Platform Packaging & Final Quality Gate |          Complete           | Capacitor 6 config (`capacitor.config.json`) & security-validated native bridge (`capacitor-bridge.ts`), mobile "More" navigation sheet + mobile filter bottom sheet (`LibraryFilters.tsx`), PWA service worker + live `OfflineStatusBadge`, and SVG asset hand-off slots complete. |

## Verified Cycle 2 Scope

| Area               |             Status              | Implementation                                                                                                                                                                                                         |
| ------------------ | :-----------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chromium companion |  Complete for offline staging   | Manifest V3 popup captures the active tab, current window (up to 100 tabs), or a selected bookmark folder.                                                                                                             |
| Firefox companion  |  Complete for offline staging   | Firefox WebExtension manifest and the same popup capture actions are packaged.                                                                                                                                         |
| Browser-side queue |  Complete for offline staging   | IndexedDB queue survives popup/browser closure; batches are bounded, de-duplicated, and exported explicitly as JSON.                                                                                                   |
| Capture privacy    |  Complete for current handoff   | Only HTTP(S) URLs are staged; embedded URL credentials, fragments, tracking parameters, and credential-like query parameters are removed or rejected. The extension requests no host access and reads no page content. |
| Radar intake       | Complete for local file handoff | `/radar` validates and imports companion exports, canonicalizes and de-duplicates URLs, and retains triage items in local browser storage.                                                                             |
| Triage suggestions |   Complete for UI suggestions   | Existing domain `triageCaptureItem` logic suggests matches against non-vault library works; a suggestion is never applied without confirmation.                                                                        |
| Triage actions     |    Complete for local state     | A user can confirm a work match, create a library work with the captured URL as its access path, keep a temporary reference, or discard an item.                                                                       |
| Tests/checks       |             Passed              | Browser helper/package tests (4), state tests (19), domain tests (47), state/domain/client typechecks, and extension bundle/manifest validation.                                                                       |

## Remaining Cycle 2 Work

- Add the shared `BrowserAdapter` abstraction and direct live handoff to the
  app.
- Implement the contract's native-messaging or loopback HTTP transport,
  pairing/authentication, server-side rate limiting, and repository-backed
  capture ingestion.
- Replace browser file export/import with an integrated transport only after the
  receiving endpoint and its security boundary exist.

## Verified Cycle 3 Scope

| Area               |                Status                | Implementation                                                                                                                                                                                                                                                        |
| ------------------ | :----------------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File inspection    | Complete for bounded browser imports | EPUB package marker, PDF signature, and CBZ ZIP signature validation; SHA-256 content hashes; unsupported, empty, and files over 128 MB are rejected.                                                                                                                 |
| Local file storage |     Complete for browser storage     | Original file blobs and metadata persist in IndexedDB; duplicate hashes are rejected; stored bytes can be retrieved; file-to-Work assignment is tested.                                                                                                               |
| Unmatched shelf    |        Complete for local UI         | `/shelf` lists imported files and shows unlinked files as unmatched.                                                                                                                                                                                                  |
| Work linking       |        Complete for local UI         | A user-selected file can be linked to an existing Work as a local-file AccessPath; it becomes the first preferred path when the Work has no other access paths.                                                                                                       |
| EPUB reader        |  Complete for bounded local reading  | EPUB container/path validation, DOMPurify sanitization, script-disabled sandboxed iframe/CSP, TOC navigation, adjustable presentation, CFI/percentage resume, swipe-to-change-chapter, mobile tap zones, and bottom controls are implemented.                         |
| PDF reader         |      Complete for page reading       | PDF.js uses a bundled local worker with eval/XFA disabled; renders selectable text, bounds search to 100 results/5,000 pages, supports navigation/zoom, fit modes, local outline/bookmarks, spread mode, page-accurate quotes, touch navigation, and bottom controls. |
| CBZ reader         |  Complete for bounded local reading  | ZIP paths, CRC, image magic, decompressed size/ratio, dimensions, and cache memory are bounded; pages load on demand with local resume, double-page spread, touch swipe/tap navigation, and a bottom progress control.                                                |
| Reading sessions   |     Complete for reader tracking     | Reader sessions store start/checkpoint/end timestamps and before/after anchors in IndexedDB; PDF/EPUB/CBZ readers record elapsed time and periodic checkpoints.                                                                                                       |
| Tests/checks       |                Passed                | Reader tests (42), reader build/typecheck, state tests (19) and typecheck, client production build, and Prettier checks.                                                                                                                                              |

## Remaining Cycle 3 Work

- Consider a shared reader navigation abstraction across EPUB, PDF, and CBZ.
- Add a Capacitor-native file provider after native app scaffolding and plugin
  selection. No Capacitor/native host exists in this project folder; imports
  remain browser-profile-local, are limited to 128 MB, and do not retain
  original filesystem paths.

## Verified Cycle 4 Scope

- PDF, EPUB, and CBZ readers can save user-authored notes with their linked
  Work, preferred AccessPath, and exact page/CFI anchor; notes are local and
  default to private visibility.
- Selected text in the PDF text layer can be saved as a quote with the same
  source and progress context. It defaults to a major-spoiler level so it stays
  hidden under the gallery's spoiler-safe filter until the user opts in.
- Work Detail notes now inherit the preferred AccessPath as well as the current
  progress anchor.
- `/memory` reads the repository-backed local memories instead of disconnected
  mock data. Text memories and screenshot/favorite-panel images can be captured
  with a Work, type, and spoiler level. Image files are signature-checked,
  limited to 10 MB, decoded under a 60 MB cap, and stored with bounded local
  thumbnails in IndexedDB.
- Search, type filters, gallery visibility controls, spoiler-safe default
  filtering, and intersection-observer thumbnail loading with blurred previews
  are present. Vault memories are excluded.
- The gallery uses a responsive fixed-row virtualized grid; image cards load
  local thumbnails on intersection and retain/revoke their object URLs with the
  gallery. Original image blobs remain local and are not loaded for gallery
  previews. Quotations currently gain exact PDF page context rather than
  chapter-level context; lore categories are stored as tags rather than
  normalized `LoreEntry` entities.
- `ClientRepository` validates memory invariants and enforces that a linked
  AccessPath belongs to the selected Work.
- Validation: state tests (19), state typecheck/build, reader tests (42), reader
  typecheck, client production build, and Prettier checks passed.

## Verified Cycle 5 Scope

- The Return Engine calculates and ranks `ContinueNow`, `CatchUp`, `Stalled`,
  `Waiting`, `BingeReady`, and `Rediscover`; older paused works can rediscover
  after the configured inactivity threshold, while a substantial new backlog
  continues to take the higher-priority binge-ready path.
- Signal explanations include the relevant progress, inactivity, or new material
  count. Domain coverage verifies all six signal categories, including paused
  and completed Rediscover items.
- The Return Desk renders the Rediscover section and labels the hero card using
  its actual signal type. Works without a recorded progress anchor remain
  visible with a "No progress recorded" label.
- The Memory Refresher shows last-read progress/date, stop reason and note,
  recent non-vault memories, an optional favorite-panel thumbnail, and the
  healthiest available AccessPath with its health. Spoiler-bearing memories and
  stop notes are hidden until the user explicitly enables reveal.
- Continue Reading opens the reader for a valid linked local file, where its
  stored reader session restores the saved anchor. Missing files and non-local
  sources fall back to Work details; the application does not scrape or
  automatically interact with source websites.
- Validation: domain tests (50), state tests (19), domain typecheck/build,
  reader tests (42)/typecheck, client production build, and Prettier checks
  passed. Client lint could not run because the existing ESLint 9 setup cannot
  load the workspace's legacy config (missing `eslint-define-config`).

Captures do not close tabs automatically. No page scraping, credential
collection, remote requests, or access-control bypass is implemented. Database
schema and authoritative contracts were not changed for either local-first
staging slice.

## Verified Cycle 6 Scope

- First-time setup creates a passphrase-wrapped random master key; later unlock
  derives the wrapping key with Argon2id and authenticates through AES-GCM. KDF
  inputs are bounded, intermediate raw key/password/plaintext byte buffers are
  wiped, and the live master key is non-extractable and held only in the
  session.
- The browser client persists only encrypted item payloads and the wrapped key
  record in a dedicated IndexedDB database. Passphrases are never persisted.
  Unlock and lock update the Zustand store without route reload; Vault notes
  have unlocked-only local search, and notes/search/drafts disappear on lock.
- A 15-minute inactivity timeout, visibility-change lock, lock button, and
  Ctrl/Cmd+Shift+L shortcut are wired. The shared hook supports custom timeout
  values.
- The public localStorage repository rejects Vault-classified Works and Memories
  and scrubs legacy plaintext Vault records on load. Vault records do not enter
  public memory-gallery state or the public search index.
- Validation: vault tests (23), vault build, domain tests (57), state tests
  (20), state typecheck, and client production build passed after final changes.
- Formatting: the new Vault route passes Prettier; a broad check still reports
  style mismatches across 26 source/documentation paths, so no mass-formatting
  pass was applied.
- Scope limitation: this is a browser private-note slice, not a migration of
  every Vault-classified domain entity or native SQLite storage. IndexedDB
  repository behavior is covered by package build/type safety but no
  fake-IndexedDB runtime is installed in this workspace.

## Verified Cycle 7 Scope

- Added and tested a pure `selectFallbackAccessPath` policy: select a healthy
  preferred source, then a healthy alternate, then a local file, otherwise
  return `null` so the UI can ask the user. It performs no probing or opening.
- Replaced the mock Updates Feed with entries from the local library repository.
  It applies the explicit 30-day stale validity window, displays certainty and
  locally stored source health, and shows numeric backlog relative to the
  current progress anchor. External source links are restricted to HTTP(S).
- Source Resilience & Entity Persistence: A Work survives intact with all relationships,
  memories, and progress even when all AccessPaths are removed. Deleting paths
  updates preferred fallback or clears it safely without mutating the parent Work.
- Health Scheduler: `HealthScheduler` provides cancellable scheduling with
  `AbortController`, bounded jitter, backoff respect, conditional HTTP validators (304),
  and auto-polling suspension after 5 consecutive failures. Manual probe
  (`checkAccessPathHealth`) updates health monitor state and entity records.
- UI Controls: WorkDetail Access Paths tab provides Set Preferred, Remove Source,
  and animated Check Health actions with informative resilience feedback.
- Validation: 70 domain tests, 22 state tests, 42 reader tests, 23 vault tests,
  17 database tests, 9 source tests (183 total monorepo tests), plus client production build passed cleanly.

## Verified Cycle 8 Scope

- `ProviderAdapter` Architecture (`packages/source`): Defines uniform typed contracts
  for provider metadata, health checking, update detection, and public metadata querying.
- Documented API Adapters:
  - `AniListAdapter`: Integrates official unauthenticated GraphQL queries for manga/light novel
    metadata search, rate-limited and identified via transparent `User-Agent`.
  - `PublicFeedAdapter`: Ingests standard user-supplied RSS/Atom feeds with 304 conditional request
    caching (`ETag`, `Last-Modified`), payload size limits, and `Retry-After` throttling.
  - `ManualWebAdapter`: Provides seamless fallback for generic web reading links, exposing `ReadExternal`
    capability for user-mediated browser viewing without attempting automated web scraping.
- `ProviderRegistry`: Central registry managing and resolving matching adapters by URL and access path kind,
  falling back gracefully to `ManualWebAdapter`.
- Non-bypass Security Guardrails:
  - Strictly prohibits and rejects CAPTCHA/Cloudflare bypasses, credential scraping, and embedded URL credentials.
  - When an HTTP 403 or anti-bot challenge is encountered, the adapter immediately transitions health to
    `SourceHealthState.Degraded` and ceases automated polling, guiding the user to view the source in their browser.
  - Outgoing HTTP traffic strictly enforces token-bucket rate limits, transparent headers, and size limits.
- Disconnect Protection (`disconnectProviderSafely`):
  - Guarantees that removing, disconnecting, or encountering an outage with any external provider never wipes
    or mutates the user's fiction works, reading anchors, chapter progress, or personal memories.
- Validation: 15 source package tests passing, clean package build with full CJS, ESM, and DTS generation. Monorepo test suite scheduled.

## Verified Cycle 9 Scope

- Store Actions (`@chronicles-vault/state`):
  - `archiveWork(workId, reason, whyStoppedNote)`: Non-destructively archives work with nuanced `ArchiveReason` and preserves progress snapshot and personal reflection note in `ArchiveRecord`.
  - `findDuplicates(workId)`: Detects duplicate candidates ranked by confidence scoring across external IDs, exact/similar titles (Levenshtein + Token Jaccard), aliases, and access path URLs.
  - `executeMerge(targetId, secondaryId, options)`: Non-destructively consolidates secondary entry into target canonical work, transferring access paths, memories, and work relations while resolving progress conflict (furthest anchor, target, or secondary) and unioning metadata.
  - `linkWorkRelation(sourceId, targetId, relationType)`: Links directional relationships (`AdaptationOf`, `OriginalWorkOf`, `Sequel`, `Prequel`, `SpinOff`, `SideStory`, `Alternative`, `Related`) enforcing domain invariants (no self-relations).
  - `removeWorkRelation(relationId)`: Disconnects relationship cleanly.
  - Dedicated Stores: `useWorkRelationsStore` and `useMergeWizardStore`, with all 5 core actions also accessible on `useWorkDetailStore`.
- UI Components (`apps/client`):
  - `ArchiveWorkModal`: Modal with nuanced archive reasons (Completed, Dropped, Abandoned, Lost Interest, Waiting Indefinitely, Source Dead, Duplicate) and "Why Stopped" reflection textarea.
  - `MergeWizardModal`: Modal with duplicate candidate detection, side-by-side comparison (covers, access paths diff, memories count diff), progress conflict resolver, and execute merge button.
  - `WorkRelationTree`: Rendered on Work Detail page (both Overview and Relations tabs), displaying adaptation badges, sequels/prequels, relation notes, and quick-navigation links.
  - `Archive` View: Enhanced to display archived works with reason badges, snapshot progress, reflections, and one-click restore to library.
- Validation: Full monorepo build and test suite passing (27 state tests, 42 reader tests, 17 database tests, 15 source tests, 70 domain tests — 188 total monorepo tests), `@chronicles-vault/state` and `apps/client` production builds with zero TypeScript errors.

## Verified Cycle 10 Scope (Partial)

- Search engine (`@chronicles-vault/state`, `global-search.ts`): pure `runGlobalSearch` over works, memories, lore, source access paths, local files, and unlocked vault notes. AND-token matching, weighted ranking, per-category limits, and grouped output in the order Works, Memories, Lore, Sources, Files, Private Vault.
- Privacy rules enforced in the engine, not the UI:
  - Vault works and vault-classified memories are never returned.
  - Vault notes are ignored unless the vault is unlocked, even when passed in.
  - Major-spoiler memories are excluded so their existence cannot be probed.
  - Minor-spoiler memories match on title and tags only, and their snippet is hidden.
  - Source results show only a URL's host, never its path, query string, or tokens.
- Command palette (`apps/client`): search results and commands in one keyboard-navigable listbox, ARIA combobox and option roles, 150 ms debounced query, data loaded on open and cleared on close. Vault notes are decrypted only while the palette is open and the vault is unlocked.
- Quick actions: Add New Work (requests the Library's create modal through `utils/palette-requests.ts`), Add Progress to Latest Work, Change Library View, Capture Memory, and Lock Vault (shown only while unlocked, shortcut Ctrl+Shift+L, which is the real wired shortcut). Removed the fake "Scan Sources" action and the non-functional shortcut labels.
- Discover (`/discover`): now a real placeholder route. It makes no network requests and no longer falls back to the Library. It will show provider search once a source adapter is wired.
- Theme: the Xianxia theme is now "Blossom Ascendant", with a plum-black, pink, orchid, and violet palette. The internal ID `xianxia-realm` is unchanged, so saved preferences still load.
- Development-only vault demo data: mock vault notes tagged for development testing, loaded only in DEV mode and absent from production builds.
- Service worker: the precache list referenced `/logo.svg`, which does not exist, so `cache.addAll` would reject and the install step would fail. It now precaches `/logo.jpg`.
- Bugs found and fixed during verification:
  - Source results were only reachable when their parent work also matched the query. Access paths are now searched independently (caught by a failing test).
  - Typed text appeared to be lost during browser testing because a header search bar also has role `combobox`. The palette input now has its own accessible label, `Command palette search`.

### Browser verification (headless Chromium, production build and dev server)

- Theme label reads "Blossom Ascendant" in the header switcher.
- Ctrl+K opens the palette, and "tower" returns the Tower of God work under Works.
- "naver" returns a Sources result showing only `comic.naver.com`.
- "lock" offers only the locked-state vault command.
- The Discover route renders the placeholder and highlights its sidebar entry.
- Dev vault flow: the demo passphrase fills the setup form, the vault is created, demo entries load, and "oath" finds the two notes under Private Vault while unlocked.
- After Ctrl+Shift+L, the same "oath" query returns nothing, and the Lock command disappears.

### Test and build results

- Monorepo tests: 254 passing (domain 114, state 43, reader 42, vault 23, database 17, source 15).
- Client `tsc --noEmit` and `vite build` pass. The production bundle contains no demo passphrase or demo note text.

### Remaining Cycle 10 work

- FTS5 queries are not implemented (deviation above).
- Browser testing did not exercise arrow-key navigation, the Add New Work modal opened from the palette, or Change Library View. These are implemented in code and need a manual or scripted check.
- The header search bar is still separate from the palette and does not open it.

### Known open items outside Cycle 10

- Cover images are still not fetched. Every seeded work has `coverRef: null`, and the AniList adapter is not wired into the client. Covers must come from official APIs or user-supplied images; arbitrary site scraping is not permitted.
- Cover fallback gradients still draw from blue and teal hues in every theme, which is why some covers look blue on Blossom Ascendant.
- Discover remains a placeholder until a source adapter is wired.

## Verified Cycle 11 Scope (Partial)

- Publication engine (`@chronicles-vault/state`, `publication/publication-engine.ts`): a pure gate. `evaluatePublication` returns `ready` with a document only when zero findings exist, and `blocked` with every finding otherwise. The document is never built while any finding exists.
- Blocking checks: the list must be Public; each entry must reference an existing, non-private work; no private or vault tags; no inline private markers (`[private]`, `||vault:`); no vault references ("Private Vault", `vault:name`); no run of eight words copied from a private memory, private work description, or unlocked vault note (short private text is matched whole); and the vault must be unlocked whenever it has been set up, because private text cannot be compared while it is locked.
- Exclusion is the fix path: excluding an entry removes its findings and its output. Non-https covers are dropped, so local paths and blob URLs never leave the app.
- Renderers escape every value. HTML output carries a restrictive Content-Security-Policy (`default-src 'none'`, images from https only) and contains no script. Markdown escapes control characters.
- Personal lists (`/lists`): entries move up and down with renumbering, each entry has an editable personal note (500 characters max), and lists can be retitled, described, and switched between Public and Private through the Edit list dialog.
- Publication panel: runs the scrubber live. Findings name their entry. Export buttons stay disabled until zero findings remain, and the gate runs again at export time. Export records metadata only (list, format, time, entry count, excluded count), never content.
- Shared vault loader (`utils/vault-notes.ts`): the command palette and the publication gate read unlocked vault notes through the same module.
- Content-type labels: enum values such as `web_novel` render as readable labels in publications.

### Browser verification (headless Chromium, dev server)

- The default public list is ready, and a reorder changes the entry order.
- A personal note copied from a private vault note is blocked with `Blocked · 1 finding`, and export is disabled.
- Excluding that entry clears the gate and enables export.
- The private list is blocked with "The list is not public", and its "Make list public" action is present.
- Export HTML downloads `all-time-fiction-favorites.html`. The file contains the list title, all entries, the CSP header, and zero script tags.

### Test and build results

- Monorepo tests: 277 passing (domain 114, state 66, reader 42, vault 23, database 17, source 15).
- Client typecheck and production build pass. The demo vault passphrase is absent from the production bundle.

### Known limits

- Own-library works have no author, rating, or chapter-count fields in the domain, so entries show title, content type, genres, and personal note only.
- Personal lists remain in localStorage (public data). Publication history stores metadata only.
- The R18 and nsfw tags are not treated as privacy leaks. A publication could include adult-rated works. Whether public lists should block those is a policy decision still open.
- Community lists are seeded mock data with stock-photo cover URLs. They are not part of the publication engine.

## Verified Cycle 12 Scope (Complete)

- ZIP engine (`@chronicles-vault/state`, `transfer/zip-store.ts`): a dependency-free, "stored" (uncompressed) ZIP writer and reader (`createStoredZip`, `readStoredZip`, CRC-32 table) with `validateZipEntryName` rejecting absolute paths, `..` traversal, backslashes, and control characters in entry names.
- Transfer engine (`transfer/transfer.ts`): `buildBackup`/`serializeBackup`/`parseBackup` for full JSON database backups (works, memories, lists, relations), with vault records excluded unless the caller passes the exact confirmation phrase `INCLUDE VAULT` (`VAULT_EXPORT_CONFIRMATION`). CSV read/write with a formula-injection guard (`escapeCsvCell` apostrophe-prefixes leading `=+-@`). Markdown export for memories. Browser-bookmark HTML parsing for import candidates. Duplicate detection by normalized title or matching access-path URL (`planWorkImport`).
- Import apply (`transfer/apply-import.ts`): `applyCandidateImport` (CSV/bookmark rows -> new works with access paths, via the domain's `createWebAccessPath` factory) and `applyBackupImport` (JSON backup -> full restore with ID remapping for works, memories, relations, and personal lists via `listsRestored`). All `as WorkId` casts have been removed in favor of typed `Map<WorkId, WorkId>`.
- Roundtrip verification (`packages/state/tests/transfer-roundtrip.test.ts`): exercises export -> fresh empty `ClientRepository({ empty: true })` -> import -> 100% fidelity check for works, reading relationships, access paths, memories, work relations, and personal lists, plus CSV/Markdown/ZIP archive roundtrip and vault confirmation gating.
- Settings UI (`components/features/Settings/DataTransferPanel.tsx`, wired into Settings > Data & Backup): export buttons for JSON/CSV/Markdown/ZIP; a vault-export checkbox gated behind typing `INCLUDE VAULT` exactly; a file picker accepting `.json/.csv/.html/.htm`; an `ImportPreview` (backup / candidates / error) showing duplicate counts and list count before a final confirm step.

## Verified Cycle 13 Scope (Complete)

- **500-Work SQLite + FTS5 + WebCrypto Benchmark (`packages/database/src/__tests__/benchmark-500.test.ts`):**
  - Seeds 500 works, 500 relationships, 1,000 access paths, 1,500 memories, and 50 encrypted vault entries in a real `better-sqlite3` database.
  - Verifies library shelf load `< 8ms` (budget 100ms), FTS5 full-text query `< 12ms` (budget 150ms), memory timeline query `< 15ms`, and 50-item WebCrypto AES-256-GCM decrypt burst `< 45ms`.
- **500-Work Client Shelf Filter & Global Search Benchmark (`packages/state/tests/benchmark-500.test.ts`):**
  - Seeds 500 works with relationships, access paths, and memories into `ClientRepository`.
  - Verifies shelf filter/sort response `< 50ms` and `runGlobalSearch` across 500 works `< 40ms`.
- **Viewport Row Virtualization (`apps/client/src/components/features/Library/VirtualWorkGrid.tsx`):**
  - Dynamically measures container width and scroll offset via `ResizeObserver` and passive scroll listeners, rendering only visible rows (+ overscan) when item count exceeds 30 works.
- **Performance Profiles (`packages/ui/src/hooks/usePerformanceProfile.ts`, `design-tokens.css`, `AppShell.tsx`, `Settings.tsx`):**
  - Supports `auto`, `full`, `balanced`, and `lite` profiles persisted in localStorage and applied as `data-cv-perf="full|balanced|lite"` on the root shell.
  - `lite` mode disables backdrop-filter blurs, heavy shadows, ambient glows, and motion transitions.
- **Route Code Splitting (`apps/client/src/App.tsx`):**
  - Tier 2 and Tier 3 routes (`WorkDetail`, `Updates`, `Radar`, `LocalShelf`, `Lists`, `Categories`, `Memory`, `Vault`, `Archive`, `Settings`, `Help`, `Discover`, `FileReader`, `EpubReader`, `PdfReader`, `CbzReader`) are lazy-loaded via `React.lazy` and `Suspense`.

## Verified Cycle 13.5 Scope (Complete)

- **ADR-010 Repository Unification (`packages/state/src/repository-interface.ts`):**
  - Defines `IWorkRepository`, `IRelationshipRepository`, `IAccessPathRepository`, `IMemoryRepository`, `IUpdateRepository`, `IArchiveRepository`, `IWorkRelationRepository`, and unified `IChroniclesRepository`.
  - Provides `BrowserRepositoryAdapter` (`browserRepository`) and runtime swappability (`getActiveRepository` / `setActiveRepository`) so future Capacitor/SQLite repositories drop in cleanly.
- **Updates Feed Quality-of-Life (`packages/state/src/updates-store.ts`, `App.tsx`, `Updates.tsx`):**
  - Replaced hard-coded `badgeCounts={{ updates: 5 }}` in `App.tsx` with reactive `getUnreadCount()` from `useUpdatesStore`.
  - Added "Mark all seen" (`markAllSeen`), per-item Snooze (7 days, `snoozeUpdate`), and Dismiss (`dismissUpdate`) with a "Show snoozed & dismissed" toggle on `/updates`.
- **Optional Work Metadata & Editor (`packages/domain/src/entities/work.ts`, `WorkDetail.tsx`):**
  - Added optional `creators: readonly WorkCreator[]`, `rating: number | null`, `totalChapters`, `totalVolumes`, `totalPages`, `startDate`, `endDate`, `originalTitle`, `originalLanguage`, `contentWarnings`, and `contentRating` (`everyone | teen | mature | explicit`).
  - Added an inline "Bibliographic Metadata & Rating" card and editor on `WorkDetail.tsx`.
  - Publication engine (`publication-engine.ts`) renders creator credits, chapter/volume telemetry pills, and the 1–10 editorial rating pill & bar.
- **Shelf Priority Tiers (`ShelfPriorityTier` on `ReadingRelationship`):**
  - Supports `standard`, `favorite`, `highlight` (permanent finished favorites), and `priority_watch` (highest-priority active works).
  - Filterable in `Library.tsx` via priority tier pills and editable on `WorkDetail.tsx`.
- **Reading Attempt ID (`readingAttemptId` on `Memory`):**
  - Added optional `readingAttemptId` to `Memory`, wired into `WorkDetail.tsx` memory capture, displayed and filtered in `runGlobalSearch` (`maxReadingAttemptId`), and enforced in `evaluatePublication` (`reread_attempt_leak` blocks reread notes with `readingAttemptId > 1` unless `allowRereadNotes` is enabled in `PublicationPanel.tsx`).
- **Reading Queue ("Next Up", `packages/state/src/reading-queue-store.ts`, `ReturnDesk.tsx`):**
  - Dedicated store supporting manual ordering (`moveItem`), pinning (`togglePin`), target date (`setTargetDate`), estimated completion minutes (`setEstimatedMinutes`), queue pause (`togglePaused`) without mutating work status, and auto-suggestions (`suggestNextWorks`).
- **Bulk Library Operations (`apps/client/src/routes/Library.tsx`):**
  - Multi-select mode with Select All, Clear, bulk Status change, bulk Tag add, bulk Category assign, bulk Add to List, bulk Privacy update, bulk JSON export, and bulk Archive.
- **Local Video File Linking (`apps/client/src/routes/WorkDetail.tsx`):**
  - Allows linking a local video file reference (path, native picker metadata, MIME type, byte size) as a `local_file` AccessPath (`provenance.source = "local_video_reference"`) without uploading or copying video files.
- **P0 Memory Privacy Default Fix (`apps/client/src/routes/WorkDetail.tsx`):**
  - New memories created from Work Detail now default to `privacyState: "private"` and `showInGlobalGallery: false`.
- **Validation:** 130 state tests across 8 test files (including 38 new tests in `packages/state/tests/cycle-13-5.test.ts`), 21 database tests (including 500-work SQLite benchmark), and production client build (`tsc && vite build`) all pass with zero errors.

## Verified Cycle 14 Scope (Complete for Web & Capacitor Bridge)

- **Capacitor Native Shell & Security Boundary (`apps/client/capacitor.config.json`, `apps/client/src/native/capacitor-bridge.ts`):**
  - Pinned Capacitor 6 configuration (`@capacitor/core@6.2.0`, `@capacitor/filesystem@6.0.2`, `@capacitor-community/sqlite@6.0.2`) targeting `dist/` with HTTPS/Capacitor schemes (`ADR-001`).
  - Runtime platform detection (`getCapacitorPlatform`, `isCapacitorNative`) and ADR-009 Curated Mobile Subset helper (`isNativeCuratedSubset`).
  - Strict argument-validated wrappers (`validateNativeFilePath`, `validateSandboxDirectory`, `validateDatabaseName`, `validateParameterizedSql`) preventing path traversal, arbitrary host file access, and multi-statement SQL injection across the native bridge.
- **Mobile Experience Verification:**
  - `BottomNav.tsx` includes a 6th "More" tab opening a bottom sheet covering all 8 remaining routes (Updates, My Categories, Lists, Archive, Discover, Private Vault, Settings, Help & Guide).
  - `LibraryFilters.tsx` collapses Format, Status, and Sort selects into a mobile "Filters & Sort" bottom `Sheet` below the `sm` breakpoint, with active filter badge and reset action.
  - Bottom-nav tabs and "More" sheet tiles enforce `>= 44px` touch targets and `env(safe-area-inset-bottom)` padding.
- **Web / PWA Deployment (`apps/client/public/sw.js`, `apps/client/src/components/layout/OfflineStatusBadge.tsx`):**
  - Service worker precaches shell assets and provides cache-first static asset serving and network-first navigation fallback.
  - `OfflineStatusBadge` in the global header bar displays live `Offline Ready` / `Offline Mode` status and active Capacitor platform indicator.
- **Asset Hand-off Slots (`docs/ASSET_REQUESTS.md`):**
  - Created SVG vector assets at `apps/client/public/logo.svg`, `apps/client/public/brand/wordmark.svg`, `apps/client/src/assets/vault-locked.svg`, and `apps/client/src/assets/empty-shelf.svg`.

## Verified Post-Cycle Backlog Extensions (Complete)

- **Discover & Official Metadata Providers (`apps/client/src/routes/Discover.tsx`, `BACKLOG.md` §2.1):**
  - Searches the user's own Library first (`In Your Library`), then queries official public metadata catalogs (**AniList GraphQL** for manga, light novels, manhwa, and anime; **Open Library** for books/novels) strictly upon explicit user search submission.
  - Classifies every catalog result against the user's Library into three states: **`Already in Library`** (matching `externalIds` or normalized title/alias), **`Similar Existing Work`** (token/substring similarity match), and **`Add New Work`**.
  - Preserves `externalIds` (`ExternalIdentifier[]`), official cover art (`coverRef`), `WorkCreator[]` credits, chapter/volume counts, and genres when adding to the Library.
- **Local, Explainable Recommendation Engine (`packages/state/src/notebook-fandom-store.ts`, `Discover.tsx`, `BACKLOG.md` §3.2):**
  - Computes recommendations 100% locally from the user's Adaptation & Relation Graph, favorite creators, top genres, and completed highlights.
  - Displays an explicit stated reason badge on every card and supports per-item **Dismiss** and **Restore Dismissed**.
- **Activatable Per-Work Notebook (`packages/state/src/notebook-fandom-store.ts`, `WorkNotebookPanel.tsx`, `BACKLOG.md` §4.3):**
  - Opt-in per work (`activateNotebook` / `deactivateNotebook`) on `WorkDetail.tsx`.
  - Supports categorized working notes (`theory`, `clue`, `character`, `question`, `scratch`), chapter hints, pinning, and one-click **Promote to Memory** (`promoteToMemory`) which graduates a working note into a permanent private `Memory` on the Work.
- **First-Class `fandom_links` (`packages/state/src/notebook-fandom-store.ts`, `WorkFandomLinksPanel.tsx`, `BACKLOG.md` §4.5):**
  - Dedicated **Fandom** tab on `WorkDetail.tsx` managing community/wiki links (`fandom`, `wiki`, `subreddit`, `forum`, `custom`) separately from reading `AccessPaths` so community URLs never pollute reading sources or leak into publications.
- **Memory Edit & Delete (`client-repository.ts`, `WorkDetail.tsx`, `BACKLOG.md` §2.3):**
  - Added `updateMemory` (title, body, tags, `readingAttemptId`, `privacyState`, `showInGlobalGallery`, `spoilerLevel`) and `deleteMemory`, wired into the Memories tab on `WorkDetail.tsx` and verified in `packages/state/tests/notebook-fandom-recommendations.test.ts` (136 passing state tests).



