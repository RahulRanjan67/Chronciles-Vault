# Chronicles Vault — Architecture Decision Records (ADR)

This log documents all fundamental architectural decisions, the context that motivated them, alternative solutions considered, and their trade-offs.

---

## ADR-001: Capacitor for Native Mobile Packaging

### Status: Accepted
### Date: 2026-10-05

### Context
The existing application is a React/Vite client with browser-local storage and reader features. The project needs a path to native mobile packaging and OS lifecycle/file-picker integration without introducing a second application UI. The previous Tauri desktop proposal does not match the selected direction.

### Decision
Use **Capacitor** to package the existing React client for iOS and Android. Keep web as a first-class target. Select and pin plugin versions when native scaffolding is undertaken; use narrow, permission-minimized plugin interfaces for file access, lifecycle events, and SQLite. Capacitor does not by itself establish Windows/Linux desktop support.

### Consequences
- **Positive**:
  - The existing React/Vite UI remains the single UI across web and native mobile.
  - Native mobile capabilities are accessed through explicit plugin APIs rather than a broad custom IPC surface.
- **Negative / Trade-offs**:
  - Native filesystem and SQLite capabilities require compatible Capacitor plugins and platform-specific permission/testing work.
  - Desktop-native file access is no longer implied; any desktop shell must be separately selected and documented.
  - Native packaging/scaffolding is still pending in the current workspace.

---

## ADR-002: Embedded SQLite 3 with FTS5 as Primary Storage Engine

### Status: Accepted
### Date: 2026-10-01

### Context
A core product thesis of Chronicles Vault is **local-first sovereignty**. User data must never be locked behind a mandatory cloud database or server process. We need an embedded engine capable of relational queries, foreign key cascades, atomic transactions, and sub-50ms full-text search.

### Decision
We adopt **SQLite 3** operating in WAL (Write-Ahead Logging) mode, utilizing the built-in **FTS5 (Full-Text Search 5)** virtual table extension.

### Consequences
- **Positive**:
  - Single-file database (`vault.db`) makes backups, exports, and directory migrations trivial.
  - Zero-configuration embedded engine requiring no background daemon.
  - FTS5 contentless tables deliver instant full-text search with minimal disk overhead.
- **Negative / Trade-offs**:
  - SQLite is single-writer. Concurrent write spikes must be managed with `PRAGMA busy_timeout = 5000` and short transaction scopes.

---

## ADR-003: Argon2id + AES-256-GCM for Vault Cryptography

### Status: Accepted
### Date: 2026-10-02

### Context
Users store private notes, intimate reading reflections, and reading logs they do not want exposed to malware, curious onlookers, or unencrypted disk searches. The encryption mechanism must resist GPU/ASIC brute-force dictionary attacks while executing fast enough for interactive unlock.

### Decision
We implement a two-tier key hierarchy:
1. **Argon2id KDF**: Master passphrase derives a Key Encryption Key (KEK) using 64MB memory cost, 3 iterations, and a 32-byte CSPRNG salt.
2. **AES-256-GCM Cipher**: The KEK unwraps a randomly generated Data Encryption Key (DEK). The DEK encrypts private records with a fresh 12-byte IV per record and a 16-byte authentication tag.
3. WebCrypto API stores the DEK as a non-extractable `CryptoKey` in memory, which is immediately cleared on lock.

### Consequences
- **Positive**:
  - Military-grade memory-hard resistance against offline cracking.
  - Tamper detection built-in via Galois/Counter Mode auth tags.
  - Changing the master passphrase requires re-wrapping only the 32-byte DEK rather than re-encrypting the entire database.
- **Negative / Trade-offs**:
  - Argon2id requires `@noble/hashes` WebAssembly/JS implementation because native browser Web Crypto API does not yet implement Argon2id.

---

## ADR-004: Monorepo with pnpm Workspaces & Turborepo

### Status: Accepted
### Date: 2026-10-02

### Context
The system spans client web apps, a desktop shell, browser extensions, shared domain logic, database migrations, and reader engines. Maintaining separate git repositories would lead to dependency drift, broken interfaces, and integration friction.

### Decision
We use a **pnpm workspaces monorepo orchestrated with Turborepo**.

### Consequences
- **Positive**:
  - Hard symlinked internal packages (`@chronicles-vault/domain`, `@chronicles-vault/database`, etc.) allow immediate propagation of type changes.
  - Turborepo pipelines provide intelligent caching for `lint`, `typecheck`, and `build`.
  - pnpm's content-addressable storage saves gigabytes of disk space and guarantees strict dependency boundaries.
- **Negative / Trade-offs**:
  - Developers must understand monorepo dependency graph rules (e.g. packages cannot import from apps).

---

## ADR-005: Separation of Work and ReadingRelationship

### Status: Accepted
### Date: 2026-10-02

### Context
Traditional book trackers collapse the book and the user's progress into a single database row. This makes it difficult to model re-reading, multi-format reading (listening to audiobook while reading EPUB), or tracking works that exist in a series before reading them.

### Decision
We strictly decouple `Work` (objective bibliographic metadata) from `ReadingRelationship` (user's personal reading state, rating, and priority).

### Consequences
- **Positive**:
  - Clean domain boundaries. Works can be seeded, imported from catalog APIs, or shared without exposing personal reading habits.
  - Enables multiple reading attempts (`reading_attempts`) and multi-path access (`access_paths`) per work.
- **Negative / Trade-offs**:
  - Requires relational `JOIN`s to present library shelf views with progress bars. Mitigated by optimized compound indexes on `reading_relationships`.

---

## ADR-006: Zustand for State Management & Zero-Reload Vault Transitions

### Status: Accepted
### Date: 2026-10-03

### Context
State management needs to be lightweight, performant, easily testable outside of React components, and capable of handling dynamic security state shifts (unlocking/locking the Vault) without forcing full-page reloads (`window.location.reload()`).

### Decision
We select **Zustand** for client state stores.

### Consequences
- **Positive**:
  - Microscopic bundle size (< 2 KB).
  - Direct store access outside React components (e.g. inside background sync loops and reader event handlers).
  - Granular selector subscriptions prevent unnecessary component re-renders.
  - Reactively re-hydrates private data on `vault:unlocked` and purges it on `vault:locked` with zero DOM disruption.
- **Negative / Trade-offs**:
  - Lacks the rigid built-in devtools time-travel features of Redux, though Zustand's simplicity outweighs this.

---

## ADR-007: TanStack Virtual for High-Density Grid Windowing

### Status: Accepted
### Date: 2026-10-03

### Context
Users with libraries exceeding 1,000+ books experienced noticeable frame drops and memory spikes when rendering entire DOM trees of cover art cards.

### Decision
We standardize on **`@tanstack/react-virtual`** for all list, table, and grid views exceeding 30 items.

### Consequences
- **Positive**:
  - Constant DOM node count (~20 to 40 elements) regardless of library size.
  - Butter-smooth 60 FPS scrolling even on modest hardware.
- **Negative / Trade-offs**:
  - Requires deterministic card heights or aspect ratios (`aspect-[3/4]`), which our design system strictly standardizes.

---

## ADR-008: FastAPI for Optional Headless Backend

### Status: Accepted
### Date: 2026-10-04

### Context
When a supported native client runs locally with SQLite, some power users host personal digital libraries on home servers (Unraid, TrueNAS, Synology) and want a headless REST API with automatic OpenAPI documentation.

### Decision
We provide an optional headless service in `services/api/` built with **FastAPI (Python 3.11+)**.

### Consequences
- **Positive**:
  - Automatic OpenAPI / Swagger UI interactive documentation.
  - High performance asynchronous I/O via `uvicorn`.
  - Excellent integration with Python machine learning or NLP libraries for future local semantic search.
- **Negative / Trade-offs**:
  - Introduces Python toolchain alongside Node/Rust. Kept strictly optional; desktop and web apps run entirely standalone without requiring Python.

---

## ADR-009: The Native Mobile App Is a Curated Subset, Not Feature Parity

### Status: Accepted
### Date: 2026-10-10

### Context
ADR-001 packages the existing React/Vite client with Capacitor for iOS and
Android. Taken literally, "the existing UI remains the single UI across web
and native mobile" could be read as every screen — bulk Library operations,
the full Work editor, Work Relations editor, Notebook, Settings' advanced
tabs — being crammed unchanged into a 375px-wide native shell. The product
owner has decided against that: a phone is not where someone manages 500
works' metadata or runs a 12-step bulk operation.

### Decision
The Capacitor-packaged mobile app intentionally ships a **toned-down,
touch-first subset** of the product, not a 1:1 port of the desktop/web
layout. The responsive website, opened in a phone's browser, keeps full
feature parity with desktop — nothing is removed there. Only the installed
native app trims scope.

Concretely, for screens or operations that are power-user-oriented or
data-dense (bulk Library operations, the full Work editor, the Work
Relations editor, Notebook when activated on many works at once, Settings'
Advanced section, the eventual desktop-class Dense Table view), the native
app may present a reduced version or a clear "Open in browser for the full
editor" affordance instead of reflowing the entire desktop surface into a
phone-width layout. Core day-to-day actions (read, track progress, capture
a memory, check updates, search, use the Reading Queue) stay fully native.

Where exactly the line falls between "full native screen" and "reduced /
hand-off to browser" is decided per-screen as each one is built, not
specified exhaustively up front.

### Consequences
- **Positive**:
  - The native app's IA can stay simple and fast rather than trying to fit
    every desktop control into a bottom sheet.
  - Avoids building and maintaining two full implementations of data-dense
    screens (one crammed for 375px, one for desktop).
- **Negative / Trade-offs**:
  - Some functionality is only reachable by opening the website in the
    phone's browser, which must be a deliberate, well-labeled hand-off
    (never a silent gap) so it doesn't read as a missing feature.
  - Increases the number of per-screen judgment calls during Cycle 14
    native-shell work, rather than a single blanket rule.

---

## ADR-010: Repository Boundary to Unify the Persistence Layer

### Status: Accepted
### Date: 2026-10-10

### Context
`packages/state/src/client-repository.ts` currently persists works,
relationships, memories, archive records, and relations directly to
`localStorage`. The Private Vault uses encrypted IndexedDB
(`packages/vault`). ADR-002 names SQLite + FTS5 as the primary storage
engine, which today is only true inside `packages/database` (used by the
Node-side export/import roundtrip test and intended for a future
Capacitor/desktop host with real filesystem access) — the browser client
has no SQLite story at all. Three different durability/capacity models
for one app creates fragmented migration and backup logic, inconsistent
query/search behavior between environments, and no single place to apply
Vault-grade protection consistently.

### Decision
Introduce a proper repository boundary rather than adding a fourth storage
mechanism:

```
Domain Repository Interfaces
        ↓
Browser Repository Implementation
        ↓
IndexedDB/localStorage transition adapter
        ↓
Future SQLite/Desktop Repository
```

UI and feature code depend only on the domain repository interfaces and
must never branch on which concrete backend is active. The existing
localStorage-backed `client-repository.ts` becomes one interchangeable
implementation behind that interface, not the thing feature code talks to
directly. This is scoped as the first item of Cycle 13.5 (see
`IMPLEMENTATION_PLAN.md`) specifically because every later cycle's data
model changes (new optional Work metadata fields, bulk operations, the
Reading Queue, Notebook) are cheaper to land once there is one seam to
change instead of three.

### Consequences
- **Positive**:
  - A future SQLite-backed (desktop/Capacitor) repository can be dropped in
    without touching feature/UI code.
  - One place to apply Vault-grade access control and one place to fix
    backup/export fidelity, instead of three.
- **Negative / Trade-offs**:
  - Short-term refactor cost touching every store that currently imports
    `client-repository.ts` directly.
  - Does not itself add SQLite to the browser client — the interim
    implementation is still IndexedDB/localStorage until a host with real
    filesystem access (Capacitor/desktop) exists to justify embedding
    SQLite in the browser (e.g. via OPFS + wa-sqlite).
