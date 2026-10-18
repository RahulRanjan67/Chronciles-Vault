# Chronicles Vault — Agent Collaboration & Implementation Rules

This document outlines the **15 Non-Negotiable Rules** governing all automated agents and developers contributing code to the Chronicles Vault codebase. Violating these rules will result in rejected pull requests and failed validation gates.

---

## The 15 Non-Negotiable Rules

### Rule 1: Contract Primacy
Contract files in `docs/` (`DOMAIN.md`, `DATABASE.md`, `UI-CONTRACT.md`, `VAULT-CONTRACT.md`, etc.) are authoritative. No agent may alter public interface signatures, database schemas, or domain entity fields without explicit, documented architectural approval.

### Rule 2: Strict Type Safety & Zero-Warning Policy
The codebase enforces `"strict": true` and `"noUncheckedIndexedAccess": true`. Code that generates TypeScript compilation errors (`tsc --noEmit`), ESLint warnings, or unresolved imports will fail CI immediately. Explicit `any` is strictly prohibited; use typed generics or `unknown` with type guards.

### Rule 3: Absolute Vault Boundary Enforcement
Under no circumstances may data marked with `privacy_state = 'vault'` be written to plaintext logs, unencrypted database columns, system telemetry, browser localStorage, or plaintext FTS5 indices. Decrypted data must reside only in non-extractable in-memory structures while the vault is in the `Unlocked` state.

### Rule 4: Domain Immutability
All domain entities (`Work`, `ReadingRelationship`, `Memory`, `ProgressAnchor`, etc.) are defined with `readonly` properties. Mutating an entity in place is forbidden. Always use pure factory or updater functions (e.g., `applyWorkPatch(work, patch)`) that return a fresh, validated instance.

### Rule 5: Design Token Compliance
UI components must exclusively consume semantic CSS variables (`--cv-*`) or their mapped Tailwind utility classes (`bg-cv-bg`, `text-cv-text`, `border-cv-border`). Hardcoded hex values, raw pixel sizes outside the 4px grid, or arbitrary non-token values are strictly forbidden.

### Rule 6: Rate Limiting & Network Hygiene
Every outbound HTTP request must be routed through the centralized Token Bucket Rate Limiter in `@chronicles-vault/source`. Adapters must respect remote server capacity, provide informative `User-Agent` headers, and implement exponential backoff with random jitter.

### Rule 7: Zero-Bypass & Digital Legality
Chronicles Vault is a personal reading tracker and organizer, not a pirate downloader. Code that circumvents DRM (Kindle, ADEPT, FairPlay), solves anti-bot CAPTCHAs, scrapes paywalled chapters, or intercepts user passwords is strictly prohibited. When a source blocks access, adapters must cleanly degrade to manual tracking mode.

### Rule 8: Idempotent & Atomic Migrations
Every database schema modification must be delivered as a numbered SQL migration file in `packages/database/src/migrations/`. Migrations must execute atomically within transactions and be completely idempotent. Production migrations must never drop tables or columns containing active data without a planned migration path.

### Rule 9: Cancellable Background Workflows
All long-running or background processes (file scanning, metadata fetching, health checks, archive generation) must accept an `AbortSignal` or cancellation token. Tasks must report progress percentages and support immediate cooperative cancellation.

### Rule 10: Fault-Tolerant Reader Adapters
Format engines (EPUB, PDF, CBZ) must isolate parsing failures. A corrupted ebook file, missing image entry, or malformed XML spine must produce a structured error message within the reader shell rather than crashing the host application or freezing the main UI thread.

### Rule 11: Privacy-Partitioned Search Indexing
The FTS5 virtual table `search_fts` must only index public and non-vault entities. When the vault is unlocked, searches across private memories are performed in-memory or via an ephemeral, encrypted in-memory SQLite table that is immediately dropped upon locking.

### Rule 12: Zero-Reload Reactive State Transitions
Locking and unlocking the Vault must **NEVER** reload the window (`location.reload()`) or tear down the active DOM tree. State transitions must trigger reactive updates across Zustand stores, smoothly swapping encrypted placeholders for decrypted content without disrupting the reader's view or scroll position.

### Rule 13: Data Sovereignty & Portability
Users own their data. Every entity (works, reading sessions, memories, tags, lore) must be exportable to standard, non-proprietary formats (JSON, Markdown with frontmatter, CSV). Never introduce proprietary lock-in structures that prevent a user from leaving Chronicles Vault.

### Rule 14: Comprehensive Verification & Test Coverage
No feature is considered complete without accompanying unit tests. Repositories, crypto routines, and state machines require 100% test coverage for happy paths and edge cases. Regression tests must accompany every bug fix.

### Rule 15: Monorepo Clean Architecture Boundaries
The package dependency hierarchy is strictly unidirectional:
- `apps/*` (client, desktop, browser) may depend on `packages/*` and `services/*`.
- `packages/*` may depend on peer packages according to the dependency graph, but **MUST NEVER** import from `apps/*`.
- `@chronicles-vault/shared` and `@chronicles-vault/domain` are pure, zero-dependency foundations.
