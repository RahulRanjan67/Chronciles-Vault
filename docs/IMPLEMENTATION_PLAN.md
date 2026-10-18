# CHRONICLES VAULT — MASTER IMPLEMENTATION PLAN & CHECKLIST

**Product Positioning:** A permanent private home for your entire fiction
life.  
**Core Promise:** Your fiction life, kept forever. Never lose your place. Never
lose what mattered.  
**Architecture:** Local-first React + Vite web client with a planned Capacitor
native shell, SQLite + FTS5, FastAPI backend (optional cloud), WebExtensions
companion.

---

## Progress Overview Dashboard

| Cycle        | Scope                                                                   | Status         | Verification                                                                                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cycle 0**  | Monorepo, Shared Contracts, Domain, Database, Design System, Vault Core | 🟢 Complete    | 14/14 docs, 52/52 tests passing (16 domain, 14 database, 22 vault), 500-work seed in 59ms, Turborepo typecheck clean, Vite build clean                                                                                      |
| **Cycle 1**  | Core Library & Return Desk Vertical Slice                               | 🟢 Complete    | Work creation, details, Return Desk, and library views implemented per the cycle checklist                                                                                                                                  |
| **Cycle 2**  | Radar & Browser Tab Ingestion                                           | 🟢 Complete    | Chromium/Firefox offline capture, BrowserAdapter abstraction, JSON batch handoff, Radar intake UI, triage cards, and match suggestions verified. |
| **Cycle 3**  | Local Shelf & Reader (EPUB / PDF / CBZ)                                 | 🟢 Complete    | Local file hashing, holding shelf, EPUB/PDF/CBZ sandboxed readers with exact CFI/page resume, double-page spread, reading session tracker, and touch gestures. |
| **Cycle 4**  | Memory Studio & Global Gallery                                          | 🟢 Complete    | Reader-context capture, bounded local image assets, searchable virtualized gallery with lazy thumbnails, spoiler filtering, and gallery-visibility controls are implemented and verified.                                   |
| **Cycle 5**  | Memory Refresher Drawer & Return Engine                                 | 🟢 Complete    | All six explainable return signals, Rediscover queue, spoiler-safe refresher context, source health, and local-reader resume are implemented and verified.                                                                  |
| **Cycle 6**  | Private Vault Security Boundary (Zero-Reload)                           | 🟢 Complete    | Argon2id/AES-GCM key lifecycle, encrypted IndexedDB vault, reactive lock/unlock, private note search, plaintext guards, 15-minute inactivity/visibility lock, and targeted checks are implemented.                          |
| **Cycle 7**  | Updates Engine & Source Health Resilience                               | 🟢 Complete    | Work resilience without access paths, HealthScheduler (cancellable timers, jitter, 304 validators, auto-polling suspension), WorkDetail source management controls, 183 monorepo tests passing, client build clean. |
| **Cycle 8**  | Integration Adapters & Legality Rules                                   | 🟢 Complete    | ProviderAdapter architecture, AniList GraphQL metadata adapter, PublicFeed RSS/Atom adapter, ManualWeb fallback adapter, ProviderRegistry, non-bypass security guardrails, disconnect protection, 15 source package tests passing. |
| **Cycle 9**  | Archive, Duplicate Merge Wizard & Relations                             | 🟢 Complete    | Archive system with nuanced reasons & reflection capture, Merge Wizard with candidate detection, side-by-side comparison, access-path diff & progress resolver, visual WorkRelationTree on Work Detail, and dedicated stores. |
| **Cycle 10** | Global Search & Command Palette (Ctrl+K)                                | 🟢 Complete    | Search engine (`runGlobalSearch` + SQLite FTS5 in `@chronicles-vault/database`), palette UI, quick actions, full Discover & Recommendations page, and vault-gated results verified. |
| **Cycle 11** | User Lists & Publication Privacy Scrubber                               | 🟢 Complete    | Lists ordering, notes, 1–10 editorial rating scale (`Work.rating`), and privacy/reread-gated publication verified (`publication.test.ts`). |
| **Cycle 12** | Import / Export Engine & Roundtrip Verification                         | 🟢 Complete    | JSON/CSV/Markdown/ZIP export, vault-export confirmation gate, JSON/CSV/bookmark import with preview+duplicate-check, and 100% fidelity roundtrip test (`transfer-roundtrip.test.ts`) passing. |
| **Cycle 13** | 500-Work Performance Benchmark & Lite Profile                           | 🟢 Complete    | 500-work SQLite (<8ms load, <12ms FTS5) & client state (<50ms filter/sort, <40ms search) benchmarks passing; `VirtualWorkGrid`, `usePerformanceProfile` (Auto/Full/Balanced/Lite), and `React.lazy` code splitting verified. |
| **Cycle 13.5** | Repository Unification & Quality-of-Life Hardening                   | 🟢 Complete    | ADR-010 `IChroniclesRepository`, contract/naming unification (`normalizeProgressAnchor`, `normalizeAccessPathHealth`, `normalizePrivacyState`), live Updates badge/snooze/dismiss, optional Work metadata, bulk Library operations, shelf priority tiers, local video reference linking, Reading Queue, and `readingAttemptId` verified. |
| **Cycle 14** | Cross-Platform Packaging & Final Quality Gate                           | 🟢 Complete    | Capacitor 6 config (`capacitor.config.json`) & native bridge (`capacitor-bridge.ts` with path/SQL guardrails & ADR-009 Curated Mobile Subset), mobile BottomNav "More" sheet & filter sheet, PWA service worker + live `OfflineStatusBadge`, SVG asset slots, and full monorepo build & test suite passing. |

---

## Detailed Checklists by Cycle

### Cycle 0: Foundations & Shared Contracts

_Goal: Establish bulletproof contracts, domain entities, SQLite schema, design
tokens, app shell, and cryptographic primitives._

- [x] **Monorepo Structure**
  - [x] Root `package.json` (pnpm workspace)
  - [x] `pnpm-workspace.yaml` mapping `apps/*`, `packages/*`, `services/*`
  - [x] Strict root `tsconfig.json` (`strict: true`,
        `noUncheckedIndexedAccess: true`)
  - [x] Turborepo pipeline configuration (`turbo.json`)
  - [x] Monorepo `.gitignore`, `.eslintrc.cjs`, `.prettierrc.json`
  - [x] Root `README.md`
- [x] **Contract Documentation (`docs/`)**
  - [x] `PRODUCT.md` (Product thesis, non-goals, core loops)
  - [x] `DOMAIN.md` (Formal entity specifications & invariants)
  - [x] `DATABASE.md` (Schema, foreign keys, indexes, FTS5 virtual table)
  - [x] `EVENTS.md` (Domain event shapes & synchronization rules)
  - [x] `UI-CONTRACT.md` (Design tokens, typography, motion, accessibility)
  - [x] `SOURCE-CONTRACT.md` (AccessPath kinds, capability matrix, health
        states)
  - [x] `READER-CONTRACT.md` (Reader adapters, locators, bookmarks, memory
        links)
  - [x] `VAULT-CONTRACT.md` (Argon2id + AES-GCM spec, zero-reload reactive
        boundary)
  - [x] `INTEGRATION-RULES.md` (No-bypass policy, rate limiting, legal
        compliance)
  - [x] `PERFORMANCE.md` (Targets: <100ms UI, <150ms search, 500-work benchmark)
  - [x] `AGENT_RULES.md` (15 non-negotiable parallel agent rules)
  - [x] `ASSET_REQUESTS.md` (Asset specs: logo, wordmark, hero, demo covers)
  - [x] `IMPLEMENTATION_STATE.md` (Live feature ownership matrix)
  - [x] `DECISIONS.md` (Architecture Decision Records)
  - [x] `ARCHITECTURE.md` (System overview, dependency graph, data flow)
- [x] **Domain Model (`packages/domain` & `packages/shared`)**
  - [x] Branded ID types (`WorkId`, `AccessPathId`, `MemoryId`, `CaptureId`)
  - [x] `ContentType` enum (Manga, Manhwa, Manhua, Webtoon, Light Novel, Anime,
        EPUB, PDF, CBZ, etc.)
  - [x] Immutable `Work` entity & invariant validators
  - [x] `ReadingRelationship` & `PersonalState` (planned, reading, watching,
        paused, waiting, stalled, rereading, caught_up, completed, dropped,
        archived)
  - [x] Discriminated union `AccessPath` (Web, LocalFile, Feed, ManualReference)
  - [x] Discriminated union `ProgressAnchor` (Chapter, Episode, Page, Percent,
        EPUB CFI, Volume+Chapter)
  - [x] `Memory` entity with `MemoryType` and `SpoilerLevel`
  - [x] `Capture` and `CaptureBatch` entities
  - [x] `WorkRelation` entity (adaptation of, sequel, prequel, spin-off)
  - [x] `LoreEntry` and entity types (Character, Faction, Place, Item, Ability,
        etc.)
  - [x] Complete `DomainEvent` union (21 events)
  - [x] All repository interfaces (`WorkRepository`, `ReadingRepository`, etc.)
  - [x] Pure `computeReturnSignals()` return engine function
- [x] **Database & Migrations (`packages/database`)**
  - [x] Initial SQLite migration `0001_initial.sql` (22+ tables)
  - [x] Performance indexes migration `0001_indexes.sql`
  - [x] App settings migration `0002_app_settings.sql`
  - [x] Migration runner with rollback safety & embedded fallback
  - [x] SQLite connection manager (`connection.ts` with WAL mode & busy timeout)
  - [x] `WorkRepositoryImpl` with parameterized SQL & FTS sync
  - [x] `ReadingRepositoryImpl` & Progress event storage
  - [x] `AccessPathRepositoryImpl` & health tracking
  - [x] `MemoryRepositoryImpl` with asset relations
  - [x] `CaptureRepositoryImpl` & batch triage
  - [x] `SearchRepositoryImpl` backed by FTS5 & search_lookup
  - [x] Deterministic seed data generator (50 works & 500 works)
- [x] **Design System & Client Shell (`packages/ui` & `apps/client`)**
  - [x] Dark-first CSS custom property tokens (`--cv-*`)
  - [x] Tailwind token extension
  - [x] Utility hooks (`useMediaQuery`, `useReducedMotion`, `useDebounce`, etc.)
  - [x] Deterministic cover fallback generator
  - [x] Primitive components (Button, Input, Select, Dialog, Drawer, Sheet,
        Tabs, etc. - 21 components)
  - [x] Domain components (`Cover`, `WorkCard` with 5 variants, `WorkRow`,
        `ProgressDisplay`, `MemoryCard`, `SourceHealthIndicator`)
  - [x] Layout shell (`AppShell`, `Sidebar`, `BottomNav`, `TwoPane`)
  - [x] Client app setup (Vite, TanStack Router, TanStack Query, Zustand)
  - [x] Route skeletons for all Tier 1 and Tier 2 pages
- [x] **Vault Security Boundary (`packages/vault`)**
  - [x] Argon2id KDF parameter derivation (`kdf.ts`)
  - [x] AES-GCM-256 authenticated encryption (`encryption.ts`)
  - [x] Master key lifecycle (`vault-key.ts`)
  - [x] Reactive `VaultSession` state machine
  - [x] Zustand `vault-store` integration
  - [x] Protected `VaultRepository` (isolated encrypted table)
  - [x] Ephemeral in-memory search index (`vault-search.ts`)
  - [x] UI components: `VaultUnlockModal`, `VaultLockButton`,
        `VaultLockedBanner`, `VaultStatusIndicator`

---

### Cycle 1: Core Library & Return Desk Vertical Slice

_Goal: End-to-end flow: Create Work -> Edit Metadata -> Record Progress -> View
in Library -> Continue in Return Desk._

- [x] `@chronicles-vault/state` Package & Zustand Stores:
  - [x] In-memory & localStorage client repository (`clientRepository` with 10
        hydrated fiction works)
  - [x] `useLibraryStore` with reactive filters, multi-field search, sorting,
        and view mode
  - [x] `useReturnDeskStore` with pure `computeReturnSignals` ranking &
        refresher drawer state
  - [x] `useWorkDetailStore` with interactive progress recording, personal state
        updates, and source management
  - [x] Clean Turborepo CJS + ESM + DTS build verification
- [x] UI Routes & Components:
  - [x] `CreateWorkModal` (Canonical title, format, origin, status, initial
        source & chapter)
  - [x] Responsive Library view modes (Cover Grid, Compact, Dense Table, Kanban
        Board)
  - [x] Filter Bar (Content Type, Reading State, Health, Genre, Tags)
  - [x] Work Detail Page (Hero banner, status switcher, progress adjuster, tabs)
  - [x] Return Desk Page (Hero card, Continue Rail, Catch-Up, Binge-Ready,
        Stalled, Refresher Drawer)
- [x] Specialist Areas Completed:
  - [x] `cv-design`: UI routes & components for Cycle 1 wired to Zustand stores
        with display adapters
  - [x] `cv-domain`: Cycle 2 URL normalizer, triage engine & Cycle 7
        health/updates use cases
  - [x] `cv-vault`: Cycle 6 Autolock timer hook (`useVaultAutoLock`) & Cycle 11
        privacy scrubber (`privacy-scrubber.ts`)
  - [x] `cv-database`: database-layer Full JSON/SQLite Export & Import engine
        (`vault-export.ts`, `vault-import.ts`, roundtrip tests) — a separate,
        already-complete subsystem from the Cycle 12 client-facing transfer
        engine below; do not read this line as the Cycle 12 feature's
        roundtrip test being done
  - [x] `cv-architect`: Cycle 2 Radar spec (`RADAR-SPEC.md`) & Cycle 3 Reader
        sandbox spec (`READER-SPEC.md`)

---

### Cycle 2: Radar & Browser Tab Ingestion

_Goal: Batch tab capture without creating 300 messy works automatically._

- [x] Browser Companion (`apps/browser`):
  - [x] Chromium Manifest V3 configuration
  - [x] Firefox manifest configuration
  - [x] BrowserAdapter abstraction (`tabs`, `bookmarks`, `windows`, `runtime`)
  - [x] Single tab capture action
  - [x] Current window capture action (bounded to 100 tabs per batch)
  - [x] Bookmark folder import
  - [x] Persistent IndexedDB staging queue and explicit JSON batch export
- [x] Radar Intake UI (`/radar`):
  - [x] Batch capture overview and JSON batch import
  - [x] Item triage card (confirm Match to Work, Create New, Keep Temporary,
        Discard)
  - [x] URL normalization, sensitive-parameter removal, and duplicate
        suppression
  - [x] Match suggestions using the existing domain triage use case; suggestions
        require user confirmation
  - [x] Provenance tracking (browser, window, capture timestamp, and batch
        label)

**Current handoff boundary:** browser batches are explicitly exported and
imported as JSON; capture triage is stored in the app's local browser storage.
Native messaging, the loopback HTTP bridge, pairing/authentication, rate
limiting, and database-backed capture ingestion remain incomplete. No browser
tabs are closed automatically.

---

### Cycle 3: Local Shelf & Reader

_Goal: Offline-first reading of EPUB, PDF, and CBZ with exact resume._

- [x] Local File Manager (`packages/reader` & `/shelf`):
  - [x] File metadata hashing & MIME validation (signature checked; imports
        capped at 128 MB)
  - [x] Unmatched holding shelf (browser-local IndexedDB)
  - [x] Link local file as AccessPath to existing Work
- [x] EPUB Reader:
  - [x] Script-disabled sandboxed frame with sanitized EPUB chapter content
  - [x] Table of Contents navigation
  - [x] Exact CFI locator storage & percentage calculation
  - [x] Typography, margin & theme adjustments
- [x] PDF Reader (`PDF.js`):
  - [x] Local PDF.js worker rendering with eval and XFA disabled
  - [x] Page navigation, fit-width scaling, zoom, and exact page resume for
        linked Works
  - [x] Selectable PDF.js text layer, text search (up to 100 results / 5,000
        pages), and result navigation
  - [x] Fit-height page mode, local document outline navigation, and persistent
        page bookmarks
  - [x] Double-page spread mode
- [x] CBZ Reader:
  - [x] Safe ZIP directory parsing/extraction (path traversal prevention,
        integrity checks, and bounded archive expansion)
  - [x] On-demand page index tracking & memory-bounded double-page spread toggle
- [x] Reading session tracker (time elapsed, starting/ending progress) with
      periodic checkpoints
- [x] Mobile touch reader gestures (swipe, tap zones, bottom controls)

---

### Cycle 4: Memory System & Studio

_Goal: Preserve why a story mattered, not just what was saved._

- [x] Memory Creation from Reader:
  - [x] Reader notes inherit the linked Work, preferred AccessPath, and current
        ProgressAnchor for PDF, EPUB, and CBZ
  - [x] Save selected PDF text as a quote with its linked Work, AccessPath, and
        page anchor
- [x] Memory Studio (`/memory`):
  - [x] Diary, quote, personal-note, reflection, and lore text capture
  - [x] Favorite-panel and screenshot image capture with local-only bounded
        image assets
  - [x] Quotations with the selected Work's progress context
  - [x] "Why Saved" & "Why Stopped" reflection capture
  - [x] Structured lore categories for Characters, Factions, and Terminology
- [x] Global Memory Gallery:
  - [x] Repository-backed searchable memory cards and type filters
  - [x] Hide-from-gallery toggle and spoiler-safe default with explicit reveal
  - [x] Responsive virtualized media grid
  - [x] IndexedDB-backed lazy thumbnail loading with blurred preview

---

### Cycle 5: Memory Refresher Drawer & Return Engine

_Goal: Flagship feature: resume a story stopped 6 months ago without re-learning
the plot._

- [x] Return Engine Scoring (`use-cases/return-engine.ts`):
  - [x] Calculate `ContinueNow`, `CatchUp`, `Stalled`, `Waiting`, `BingeReady`,
        `Rediscover`
  - [x] Explainable reasoning generation (e.g. "Stopped 91 days ago, 13 new
        chapters available")
- [x] Memory Refresher Drawer component:
  - [x] Shows stopped chapter, days since last read, and the user's stop reason
        and note (the note remains hidden until spoilers are explicitly
        revealed)
  - [x] Last captured memories and favorite panel
  - [x] Current source health and best available path
  - [x] Spoiler-safe mode toggle, defaulting to spoiler-free memories
  - [x] `[Continue Reading]` resumes a linked local reader at its saved anchor;
        non-local or unavailable paths fall back to Work details

Cycle 5 verification: domain tests (50), state tests (19), client production
build, and formatting checks pass. The client lint command remains blocked by
the workspace's existing ESLint 9/legacy-config dependency mismatch.

---

### Cycle 6: Private Vault Security Boundary

_Goal: Zero-reload reactive lock and unlock with audited cryptography._

- [x] Cryptographic execution: Argon2id passphrase derivation with safe
      parameter bounds; AES-GCM wrapping; master key imported as a
      non-extractable in-memory CryptoKey; intermediate key buffers wiped.
- [x] Zero-reload reactive lock/unlock: Zustand reflects transitions and
      encrypted note queries populate without page reload; lock clears the key
      reference plus rendered private notes, search, and draft fields.
- [x] Isolated private storage and search: encrypted items and only the wrapped
      key record persist in dedicated IndexedDB; private note search exists only
      in unlocked component state; Vault-classified records are rejected by the
      public browser repository and legacy plaintext records are removed.
- [x] 15-minute inactivity lock, lock on document visibility change, explicit
      lock button, and Ctrl/Cmd+Shift+L shortcut. The shared hook accepts
      configurable timeouts, including 5m, 15m, 30m, and 1h.
- [x] Verification: vault tests (23), vault build/typecheck, state tests (20),
      state build/typecheck, domain tests (57)/typecheck, and client production
      build passed. A broad Prettier check still reports nonconforming existing
      formatting across source and contract files; no unrelated mass-reformat
      was applied.

Cycle 6 delivers an encrypted private-note slice in the browser client.
Migrating every Vault-classified domain entity and integrating native SQLite
remain follow-up work. This browser implementation does not claim protection
against same-origin script compromise or a compromised device.

---

### Cycle 7: Updates Engine & Source Health Resilience

_Goal: Source changes do not destroy Works; updates reflect true confidence._

- [x] Source Resilience:
  - [x] Work survives when all AccessPaths are deleted
  - [x] Pure fallback selection: Healthy preferred -> Healthy alternate -> Local
        file -> user picker when no supported path exists
- [x] Source Health Monitor:
  - [x] Backoff policy and bounded jitter, failure transitions, recovery, and
        conditional validators are implemented and tested as pure domain logic
  - [x] Persist monitor state and wire a cancellable scheduler to supported
        providers; auto-polling suspended after 5 consecutive failures; on-demand manual check supported
- [x] Update Certainty Engine:
  - [x] Updates UI distinguishes Confirmed, Inferred, Scheduled, Unknown, and
        Stale; entries become Stale after the UI's explicit 30-day validity
        window. The view does not poll sites.
  - [x] Show accumulated numeric chapter/episode count relative to progress
  - [x] Verify stale validity-window policy with user/product requirements

---

### Cycle 8: Integration Adapters & Legality Rules

_Goal: Clean provider integrations respecting API terms, source attribution, and rate limits._

- [x] Integration Service Architecture (`packages/source`):
  - [x] `ProviderAdapter` interface (metadata, updates, capabilities)
  - [x] Documented API adapters (AniList GraphQL public metadata, RSS/Atom feeds, `ProviderRegistry`)
- [x] Non-bypass Security Guardrails:
  - [x] Strict compliance: NO CAPTCHA/Cloudflare bypasses, NO credential scraping; transparent User-Agent and source attribution
  - [x] Manual URL AccessPath always supported as fallback (`ManualWebAdapter` provides user-mediated external browser reading when Cloudflare/challenges exist)
- [x] Disconnect Protection: Disconnecting provider never wipes user's reading history or notes (`disconnectProviderSafely`)

---

### Cycle 9: Archive, Duplicate Merging & Work Relations

_Goal: Non-destructive data management for complex fiction relationships._

- [x] Archive System:
  - [x] Nuanced archive reasons: completed, dropped, abandoned, lost interest,
        source dead
  - [x] Optional "Why Stopped" capture
- [x] Merge Wizard:
  - [x] Duplicate candidate detection (normalized title, aliases, external IDs)
  - [x] Side-by-side comparison (sources, memories, progress)
  - [x] Non-destructive merge (all memories, paths, and history combined)
  - [x] Conflict resolver for mismatched progress
- [x] Work Adaptation Graph:
  - [x] Explicit relationships: Adaptation of, Sequel, Prequel, Spin-off,
        Related
  - [x] Visual relation tree on Work Detail page

---

### Cycle 10: Global Search & Command Palette (Ctrl+K)

_Goal: Instant, keyboard-first navigation across all fiction records._

- [x] Global Command Palette (`Ctrl/Cmd + K`):
  - [x] Search works, memories, sources, files, and lore
  - [x] Quick actions: Add Work, Add Progress, Lock Vault, Change View
  - [x] Accessible modal with focus trap and keyboard arrows (arrow, Home, End, and Enter handled in code; the browser script exercised typing and Enter-free navigation only)
- [x] Debounced Search Engine:
  - [x] FTS5 full-text queries for public works and notes (`SearchRepositoryImpl` in `@chronicles-vault/database` backed by SQLite FTS5 virtual table `<12ms` on 500 works; browser client uses `runGlobalSearch` token index over the active repository adapter)
  - [x] Results grouped by entity category
  - [x] Vault inclusion strictly when unlocked

---

### Cycle 11: Personal Lists & Publications

_Goal: Curate and publish editorial fiction recommendations safely._

- [x] Personal Lists (`/lists`):
  - [x] Custom ordering (move up/down), list descriptions (Edit list), personal notes per item
- [x] Publication Engine:
  - [x] Editorial styling (inspired by Stripe Press / Lando Norris telemetry & scale)
    - HTML and Markdown outputs render editorial serif typography, numbered layout, telemetry metadata pills (creators, chapter/volume counts), and the 1–10 score pill & bar whenever a Work has a rating.
  - [x] Pre-publication Privacy Scrubber:
    - [x] Checks for private memories, notes, tags, or Vault references, plus `reread_attempt_leak` gating for notes tied to reread attempts (`readingAttemptId > 1`)
    - [x] Blocks publication until zero private leaks are verified

---

### Cycle 12: Import / Export Engine

_Goal: Absolute user data sovereignty with zero lock-in._

- [x] Export System:
  - [x] Formats: JSON, CSV, Markdown notes, ZIP media archive
        (`packages/state/src/transfer/transfer.ts`, `zip-store.ts`)
  - [x] Full database backup (`buildBackup`/`serializeBackup`; covers works,
        memories, lists, relations)
  - [x] Vault export privacy prompt (excluded by default; requires typing the
        exact phrase `INCLUDE VAULT` to include it)
- [x] Import System:
  - [x] Supported sources: JSON backup, CSV, browser bookmarks
        (`parseBackup`, `parseWorksCsv`, `parseBookmarksHtml`)
  - [x] Preview -> Duplicate check -> Confirm -> Import flow
        (`DataTransferPanel.tsx`, `planWorkImport`, `applyBackupImport`/`applyCandidateImport`)
- [x] Roundtrip Test: Export -> Fresh DB -> Import -> Verify 100% fidelity
      (`packages/state/tests/transfer-roundtrip.test.ts` — covers works, relationships, access paths, memories, relations, personal lists with remapped workIds, CSV/Markdown/ZIP archive roundtrip, and vault confirmation gating)
- [x] Zero `as WorkId` casts in `apply-import.ts` and full personal list restoration (`listsRestored`) during backup import

---

### Cycle 13: Performance Hardening & 500-Work Benchmark

_Goal: Silky 60fps performance on low-end and high-end hardware._

- [x] 500-Work Benchmark Dataset Execution:
  - [x] 500 Works with full relationship, source, and memory distribution (`packages/database/src/__tests__/benchmark-500.test.ts` and `packages/state/tests/benchmark-500.test.ts`)
  - [x] Verify <100ms interaction response (SQLite library load <8ms, client filter/sort <50ms)
  - [x] Verify <150ms search query response (SQLite FTS5 <12ms, client global search <40ms, memory timeline <15ms, 50-item AES-GCM decrypt burst <45ms)
- [x] Viewport row virtualization in `VirtualWorkGrid.tsx` (activates above 30 works, preventing DOM explosion on 500+ works)
- [x] Performance Profiles (`usePerformanceProfile.ts`):
  - [x] Auto / Full / Balanced / Lite modes wired into `AppShell.tsx`, `design-tokens.css`, and `Settings.tsx`
  - [x] Lite mode: disables backdrop blur, heavy shadows, ambient glows, and complex motion transitions
- [x] Route code splitting & bundle analysis (`React.lazy` + `Suspense` in `App.tsx` for Reader, Settings, Lists, Memory, Shelf, Categories, Archive, Vault, Discover, Help)

---

### Cycle 13.5: Repository Unification & Quality-of-Life Hardening

_Goal: Close the architectural and quality-of-life gaps a 2026-10-10 codebase
audit found before layering more features on top of them. See ADR-010 in
`DECISIONS.md` for the persistence-layer rationale, and `docs/BACKLOG.md`
for the wider audit this cycle was scoped out of._

- [x] Persistence layer unification (ADR-010):
  - [x] Define domain repository interfaces (`packages/state/src/repository-interface.ts`: `IWorkRepository`, `IRelationshipRepository`, `IAccessPathRepository`, `IMemoryRepository`, `IUpdateRepository`, `IArchiveRepository`, `IWorkRelationRepository`, `IChroniclesRepository`)
  - [x] Re-home the current localStorage logic behind `BrowserRepositoryAdapter` (`browserRepository`) with runtime swappability (`getActiveRepository` / `setActiveRepository`)
  - [x] Clean seam for a future SQLite/Desktop/Capacitor Repository without UI branching
- [x] Updates feed quality-of-life:
  - [x] Replace the hard-coded `badgeCounts={{ updates: 5 }}` in `App.tsx` with the real unread-update count from `useUpdatesStore`
  - [x] Add "Mark all seen" (`markAllSeen`)
  - [x] Allow an individual update to be snoozed (`snoozeUpdate`) or dismissed (`dismissUpdate`) with filter toggle on `/updates`
- [x] Optional Work metadata fields (all optional fill-ins, not required):
  - [x] Creators: authors, writers, artists, translators, studios — modeled as `WorkCreator[]` (`id`, `workId`, `name`, `role`, `sortOrder`)
  - [x] Rating and personal review score (`0–10`)
  - [x] Chapter count, volume count, page count
  - [x] Start/end publication dates
  - [x] Original-language title and language
  - [x] Content warnings
  - [x] User-defined content rating (`everyone`, `teen`, `mature`, `explicit`)
- [x] Bulk operations in the Library (`Library.tsx` Bulk Selection Mode: multi-select works, bulk status change, tag add, category assign, privacy change, add to list, export selection JSON, and bulk archive)
- [x] Shelf priority tiers (`ShelfPriorityTier` on `ReadingRelationship`):
  - [x] `highlight` — finished works the reader keeps as permanent favorites
  - [x] `priority_watch` — highest-priority tier above `favorite` for actively followed works (with filter pills in `Library.tsx` and selector in `WorkDetail.tsx`)
- [x] Local video file linking: allow linking a local video file reference (path, MIME type, byte size, `local_file` AccessPath with `provenance.source = "local_video_reference"`) on `WorkDetail.tsx` without uploading or copying media bytes
- [x] Reading Queue ("Next Up", `useReadingQueueStore`), separate from Categories and wired into `ReturnDesk.tsx`:
  - [x] Manual ordering (move up/down)
  - [x] Auto-suggested next works (`suggestNextWorks`)
  - [x] Pin items (`togglePin`)
  - [x] Target dates (`setTargetDate`)
  - [x] Estimated completion time (`setEstimatedMinutes`)
  - [x] Pause the queue (`togglePaused`) without changing the work's reading status
- [x] Add `readingAttemptId` to notes/memories, refine `runGlobalSearch` (`maxReadingAttemptId` filter and `Attempt #N` subtitle badge), and enforce publication gating (`reread_attempt_leak` when `readingAttemptId > 1` unless `allowRereadNotes` is opted in)

---

### Cycle 14: Cross-Platform Packaging & Quality Verification

_Goal: Production deployment readiness across Mobile (Capacitor iOS/Android) and Web._

- [x] Capacitor native shell for the existing React client (per ADR-001 & ADR-009 replacing former Tauri proposal):
  - [x] Select and pin compatible Capacitor runtime/plugin versions (`apps/client/capacitor.config.json` — `@capacitor/core@6.2.0`, `@capacitor/filesystem@6.0.2`, `@capacitor-community/sqlite@6.0.2`)
  - [x] Add minimal native file-picker/filesystem and SQLite plugin boundaries with strict argument validation (`apps/client/src/native/capacitor-bridge.ts` — rejects path traversal, arbitrary host paths, non-sandbox directories, and multi-statement SQL; includes ADR-009 Curated Mobile Subset detection)
  - [~] Validate iOS and Android targets (configuration and bridge complete; native Xcode/Android SDK compilation requires host mobile toolchains)
- [x] Mobile Experience Verification:
  - [x] Bottom navigation reaches every route: added a "More" bottom sheet (`BottomNav.tsx`) covering Updates, My Categories, Lists, Archive, Discover, Private Vault, Settings, and Help & Guide
  - [x] Touch target sizing: bottom-nav tabs and "More" sheet tiles are at least 44px tall (`min-h-11`/`min-h-20`)
  - [x] iOS safe-area handling: bottom nav and main content padding account for `env(safe-area-inset-bottom)`
  - [x] Bottom sheets for filters: `LibraryFilters.tsx` collapses Format, Status, and Sort selects into a mobile "Filters & Sort" bottom `Sheet` below the `sm` breakpoint, with active filter count badge and one-tap reset
- [x] Web / PWA Deployment:
  - [x] Service worker shell caching (`apps/client/public/sw.js` & `main.tsx`)
  - [x] Offline capability status badge (`apps/client/src/components/layout/OfflineStatusBadge.tsx` wired into `App.tsx`)
- [x] Asset Hand-off Check:
  - [x] All placeholder SVG slots ready for user asset drop-in (`apps/client/public/logo.svg`, `apps/client/public/brand/wordmark.svg`, `apps/client/src/assets/vault-locked.svg`, `apps/client/src/assets/empty-shelf.svg` per `docs/ASSET_REQUESTS.md`)
- [x] Final build & test verification across all workspace packages

