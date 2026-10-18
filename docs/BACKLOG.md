# Chronicles Vault — Product & Engineering Backlog

This file catalogues a codebase audit and product-direction input received
2026-10-10, beyond what was scoped directly into `IMPLEMENTATION_PLAN.md`.
Nothing here is scheduled into a specific cycle yet — it's the record of
what was raised, organized so a future session can turn any item into a
real cycle without re-deriving it from scratch.

A handful of the audit's findings were specific and urgent enough to pull
directly into **Cycle 13.5** (see `IMPLEMENTATION_PLAN.md`): persistence
unification, the hard-coded updates badge, optional Work metadata fields,
bulk Library operations, the Highlight/priority shelf tiers, local video
linking, the Reading Queue, and `reading_attempt_id`. Everything below is
the rest of that same audit, plus separate new feature ideas, still
unscheduled.

---

## 1. Architectural issues (beyond the Cycle 13.5 repository boundary)

### 1.1 Contract drift between docs and implementation — P0 (RESOLVED)

**Resolved in Cycle 13.5 / Naming Unification:**
- **`ProgressAnchor` (`type` vs `kind`, `chapter` vs `chapterNumber`, `percent` vs `percentage`, `epub_locator` vs `epub_cfi`):** Standardized on `type: 'chapter' | 'episode' | 'page' | 'percent' | 'epub_locator' | 'volume_chapter' | 'provider'` in `packages/domain/src/entities/progress.ts` and `docs/DOMAIN.md`, added `normalizeProgressAnchor(raw)` to convert any legacy shape into the canonical union, and updated `display-adapters.ts` and `ProgressDisplay.tsx`.
- **`SourceHealth` (`health` vs `healthState`):** Standardized on `SourceHealth` and `path.health` across domain, state, and client UI, and added `normalizeAccessPathHealth(path)`.
- **`WorkRelation` (`WorkRelationType` vs `RelationType`, `notes` vs `description`):** Standardized on `WorkRelationType` and `relation.notes` across `packages/state` and `apps/client`.
- **`PrivacyState` (`PrivacyState` vs `MemoryPrivacyState`):** Standardized on `PrivacyState` (`public | private | vault`) across `Work` and `Memory`, with `normalizePrivacyState(state)` converting legacy `'normal'` values to `'public'`.
- **`IChroniclesRepository` / `ClientDataRepository`:** Unified in `packages/state/src/repository-interface.ts` with all composable sub-interfaces (`IWorkRepository`, `IRelationshipRepository`, `IAccessPathRepository`, `IMemoryRepository`, `IUpdateRepository`, `IArchiveRepository`, `IWorkRelationRepository`, `IChroniclesRepository`) and runtime adapter swappability (`getActiveRepository` / `setActiveRepository`).

### 1.2 Memory privacy default bug — P0 (RESOLVED)

`apps/client/src/routes/WorkDetail.tsx` previously created new memories with
`privacyState: "public"`. **Resolved in Cycle 13.5:** new memories on
`WorkDetail.tsx` now default to `privacyState: "private"` and
`showInGlobalGallery: false`, matching `VAULT-CONTRACT.md` and reader memory
capture defaults.

### 1.3 Finish and verify Cycle 12 import/export — P0 (RESOLVED)

**Resolved in Cycle 12:** roundtrip test (`packages/state/tests/transfer-roundtrip.test.ts`)
verifies export -> fresh DB -> import -> 100% fidelity across works,
relationships, access paths, memories, relations, and personal lists;
all `as WorkId` casts in `apply-import.ts` were removed; and backup import now
restores personal lists with remapped work IDs (`listsRestored`).

---

## 2. High-impact product improvements — P1

### 2.1 Wire metadata providers into Discover — (RESOLVED)

**Implemented in `apps/client/src/routes/Discover.tsx`:**
- Searches the user's own Library first (`In Your Library`), then queries official public metadata APIs (**AniList GraphQL** for manga, light novels, manhwa, and anime; **Open Library** for books/novels) strictly upon explicit user search submission.
- Classifies every catalog result against the user's Library into three states: **`Already in Library`** (matching `externalIds` or normalized title/alias), **`Similar Existing Work`** (token/substring similarity match), and **`Add New Work`**.
- Preserves `externalIds` (`anilist`, `openlibrary`), official cover art (`coverRef`), `WorkCreator[]` credits, chapter/volume counts, and genres when adding to the Library.

### 2.2 A true Work-edit page

`WorkDetail` includes an inline Bibliographic Metadata & Rating editor (rating, creators, chapter/volume/page counts, original title/language, start/end dates, content rating, and content warnings) plus cover upload/URL/AniList fetch, status, and shelf priority tier selectors. Future expansion can add a standalone full-screen editor for series ordering and bulk alias management.

### 2.3 Evolve Memories into a fuller note system — (PARTIALLY RESOLVED)

`clientRepository.updateMemory` (title, body, tags, `readingAttemptId`, `privacyState`, `showInGlobalGallery`, `spoilerLevel`) and `clientRepository.deleteMemory` are now implemented and wired into `WorkDetail.tsx` (Memories tab includes privacy toggle, attempt badge, and delete controls, plus one-click graduation from the Working Notebook). Future extensions can add memory-to-memory graph linking and quote $\rightarrow$ theory templates.

### 2.4 Make Work Relations editable from Work Detail — (RESOLVED)

`WorkRelationTree.tsx` provides an interactive "Link Work" form on `WorkDetail.tsx` supporting `AdaptationOf`, `OriginalWorkOf`, `Sequel`, `Prequel`, `SpinOff`, `SideStory`, and `Related`, automatic inverse relation display (`getInverseRelationType`), relation context notes, and one-click unlinking.

### 2.5 Improve the Updates feed (beyond the Cycle 13.5 unread-count fix)

Cycle 13.5 added real unread badge counts, "Mark all seen", and per-item Snooze (7d) & Dismiss with filter toggles. Future polish can add grouping updates by work and Priority Watch notification filters.

### 2.6 Finish command search / FTS5

Global search (`global-search.ts`) supports privacy-enforcing search across Works, Memories, Lore, Sources, Files, and unlocked Private Vault notes, plus `readingAttemptId` filtering. SQLite FTS5 is implemented and benchmarked in `packages/database` (`< 12ms` on 500 works).

### 2.7 Improve reader note-taking

Reader-side notes attach linked Work, preferred AccessPath, and exact page/CFI progress anchors. Future polish can add an in-reader side-panel note list and highlight-to-Notebook quick actions.

---

## 3. Natural extensions — P2

### 3.1 Reading statistics and goals

Built on the reading-session and progress-anchor data the app already
records: chapters/pages per week or month, reading streak, average reading
speed, estimated completion time, heatmap calendar, and annual reading goals.

### 3.2 A local, explainable recommendation engine — (RESOLVED)

**Implemented in `packages/state/src/notebook-fandom-store.ts` (`generateLocalRecommendations`, `useRecommendationsStore`) and wired into `apps/client/src/routes/Discover.tsx`:**
- 100% local and private recommendation engine over the user's own Library, Adaptation & Relation Graph, favorite creators, and top genres.
- Every recommendation card includes an explicit stated reason badge (e.g., *"Connected to [Work] in your Adaptation & Relation Graph"*, *"By [Creator] (creator of [Work])"*, *"On your Plan to Read shelf · Matches your affinity for [Genres]"*, *"Completed favorite · Ideal for a reread pass"*) plus per-item **Dismiss** and **Restore Dismissed** actions.

---

## 4. New feature ideas

### 4.1 Series-aware progress

Track volume, chapter, episode, side-story, and reread/attempt number as a
composite rather than a single progress number.

### 4.2 Spoiler-aware rereading

Cycle 13.5 added `readingAttemptId` to Memories, `maxReadingAttemptId` filtering in `runGlobalSearch`, and `reread_attempt_leak` gating in the Publication Engine. Future work can auto-reveal earlier-attempt notes as the reread anchor advances.

### 4.3 Notebook — a separate, activatable scratchpad (distinct from Description and Memories) — (RESOLVED)

**Implemented in `packages/state/src/notebook-fandom-store.ts` (`useNotebookStore`) and `apps/client/src/components/features/WorkDetail/WorkNotebookPanel.tsx`:**
- Deliberately opt-in per work (`activateNotebook(workId)` / `deactivateNotebook(workId)`).
- Supports categorized working notes (`theory`, `clue`, `character`, `question`, `scratch`), chapter hints, pinning, and one-click **Promote to Memory** (`promoteToMemory(entryId)`) which graduates a working note into a permanent private `Memory` on the Work.

### 4.4 External highlight/data import

Beyond the Cycle 12 transfer engine's own backup/CSV/bookmark formats,
support importing from Kindle clippings, Goodreads CSV, StoryGraph export,
AniList/MAL export, Calibre metadata, and OPDS catalogs.

### 4.5 `fandom_links` — a first-class entity, separate from Access Paths — (RESOLVED)

**Implemented in `packages/state/src/notebook-fandom-store.ts` (`useFandomLinksStore`) and `apps/client/src/components/features/WorkDetail/WorkFandomLinksPanel.tsx`:**
- Models `FandomLink` (`id`, `workId`, `communityName`, `provider: 'fandom' | 'wiki' | 'subreddit' | 'forum' | 'custom'`, `canonicalTitle`, `url`, `language`, `isPreferred`, `provenance`, `lastCheckedAt`, `createdAt`, `updatedAt`) completely separate from reading `AccessPaths`.
- Dedicated **Fandom** tab on `WorkDetail.tsx` with community cards, preferred wiki badge, language tag, external launch, and add/remove controls.

