# Chronicles Vault — Source & Provider Contract Specification

## 1. Access Path System Architecture

In Chronicles Vault, a `Work` is an abstract intellectual item, whereas an `AccessPath` is the concrete route through which the reader accesses and reads that item. A user may read the same work across multiple editions (e.g., an EPUB stored on an SSD, a web serial read on an author's platform, or a physical hardback on a bedside table).

### 1.1 AccessPath Kinds
```typescript
export enum AccessPathKind {
  /** Local digital file stored on the user's filesystem (EPUB, PDF, CBZ/CBR). */
  LocalFile = 'local_file',
  /** Direct web URL to an authorized reading platform or serial page. */
  Web = 'web',
  /** Standard RSS/Atom feed notifying of new releases or chapters. */
  Feed = 'feed',
  /** Manual tracking mode (e.g. physical book, unsupported application). */
  Manual = 'manual',
}
```

---

## 2. Capabilities & Health Matrix

### 2.1 Provider Capabilities
Not all sources support the same operations. Sources advertise their capabilities dynamically via the `Capability` enum:

```typescript
export enum Capability {
  /** Can open directly in internal built-in reader. */
  ReadInternal = 'read_internal',
  /** Can open in external system browser or default application. */
  ReadExternal = 'read_external',
  /** Supports bi-directional reading progress synchronization. */
  ProgressSync = 'progress_sync',
  /** Can fetch table of contents / chapter list. */
  ChapterList = 'chapter_list',
  /** Can query source for metadata (synopsis, author, cover, tags). */
  MetadataQuery = 'metadata_query',
  /** Can discover new chapter releases and update entries. */
  UpdateDetection = 'update_detection',
}
```

### 2.2 Health States
Access paths undergo periodic background health checks to ensure URLs are alive, local files exist on disk, and authenticated sessions remain valid:

```typescript
export enum SourceHealthState {
  /** Endpoint reachable and healthy; local file exists on disk. */
  Healthy = 'healthy',
  /** Source responsive but experiencing rate limiting, slow responses, or minor errors. */
  Degraded = 'degraded',
  /** HTTP 404, file removed from disk, or site permanently offline. */
  Broken = 'broken',
  /** Not checked yet or check overdue (> 14 days without probe). */
  Unknown = 'unknown',
}
```

### 2.3 Update Certainty
When detecting new chapters or volumes, providers assign confidence ratings:

```typescript
export enum UpdateCertainty {
  /** Verified directly against an authoritative RSS feed or source API. */
  Confirmed = 'confirmed',
  /** Inferred from page count changes or indirect metadata changes. */
  Inferred = 'inferred',
  /** Anticipated based on regular publication schedule (e.g. weekly manga). */
  Scheduled = 'scheduled',
  /** Discovered via untrusted or ambiguous scrapers. */
  Unknown = 'unknown',
  /** Release record exists but has not been verified within the validity window. */
  Stale = 'stale',
}
```

---

## 3. ProviderAdapter Interface Specification

Every source integration (local file handler, RSS reader, web scraper, catalog API) must implement the `ProviderAdapter` interface:

```typescript
import { Result } from '@chronicles-vault/shared';
import { ProgressAnchor } from './progress-anchor';
import { UpdateEntry } from './update-entry';

export interface ProviderMetadata {
  readonly id: string;                     // e.g., 'provider.local-file', 'provider.mangadex'
  readonly displayName: string;            // e.g., 'Local File Reader', 'MangaDex API'
  readonly version: string;
  readonly supportedKinds: readonly AccessPathKind[];
  readonly capabilities: readonly Capability[];
}

export interface HealthCheckResult {
  readonly healthState: SourceHealthState;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

export interface ChapterItem {
  readonly id: string;
  readonly index: number;
  readonly title: string;
  readonly url?: string;
  readonly releasedAt?: string;
}

export interface ProviderAdapter {
  /** Metadata and capabilities advertised by this adapter. */
  readonly metadata: ProviderMetadata;

  /**
   * Determine if this adapter can handle the given URL or file path.
   */
  canHandle(target: string): boolean;

  /**
   * Verify the connectivity and availability of an AccessPath.
   */
  checkHealth(accessPath: AccessPath): Promise<Result<HealthCheckResult, Error>>;

  /**
   * Poll for updates (new chapters, new editions, or file modifications).
   */
  detectUpdates(accessPath: AccessPath): Promise<Result<readonly UpdateEntry[], Error>>;

  /**
   * Fetch the list of chapters/sections for navigation.
   */
  fetchChapterList?(accessPath: AccessPath): Promise<Result<readonly ChapterItem[], Error>>;

  /**
   * Pull progress from remote service (if capability 'progress_sync' is supported).
   */
  pullProgress?(accessPath: AccessPath): Promise<Result<ProgressAnchor | null, Error>>;

  /**
   * Push current progress to remote service (if supported).
   */
  pushProgress?(accessPath: AccessPath, anchor: ProgressAnchor): Promise<Result<void, Error>>;
}
```

---

## 4. Legality Boundary & No-Bypass Policy

Chronicles Vault operates strictly as an intellectual reading intelligence system and personal archival organizer. To protect user safety and maintain ethical legal standing, the software enforces the following hard boundaries:

### 4.1 Strict Prohibitions
1. **No DRM Circumvention**: The system does NOT decrypt Adobe ADEPT, Amazon Kindle DRM, Apple FairPlay, or any proprietary encryption schemes. Users must provide DRM-free files (EPUB, PDF, CBZ) or use official external access paths.
2. **No CAPTCHA Bypassing**: Chronicles Vault does not contain automated Cloudflare solvers, headless browser farm evasion, or puzzle-solving AI scripts. If a source challenges the connection, it reports `SourceHealthState.Degraded` and requests the user verify in their system browser.
3. **No Credential Harvesting**: The app never asks for or stores user third-party passwords. Where integration is supported, it relies exclusively on official OAuth2 flows or passive session tokens supplied voluntarily by the user's browser extension.
4. **No Unauthorized Content Redistribution**: Chronicles Vault does not re-host, seed, scrape, or distribute copyrighted book files. All content stays strictly local to the user's device or their authorized direct cloud storage.

### 4.2 Fallback to Manual Mode
When a provider modifies its DOM, terminates its API, or enacts anti-automation firewalls:
- The adapter gracefully yields without crashing.
- The `healthState` flips to `degraded` or `broken` with a clean user-facing notification.
- The user is seamlessly prompted to track the work via **Manual Mode** (entering page or chapter numbers manually) with zero loss of reading history.

---

## 5. Polling & Rate Limiting Rules

1. **Jitter & Exponential Backoff**: Background polling schedules must apply a minimum random jitter of `±20%` to prevent synchronized stampedes.
2. **Backoff on Failure**:
   - 1st failure: retry in 15 minutes.
   - 2nd failure: retry in 1 hour.
   - 3rd failure: retry in 6 hours; set health to `Degraded`.
   - 5+ failures: suspend auto-polling; set health to `Broken`.
3. **Bandwidth Throttling**: Background metadata checks must send `If-Modified-Since` or `If-None-Match` HTTP headers to utilize HTTP 304 Not Modified whenever supported.
