# Chronicles Vault — Integration Rules & Network Policy

## 1. Provider Legality & External Service Policy

Chronicles Vault is designed to provide personal reading intelligence while maintaining complete ethical integrity and strict adherence to digital copyright standards.

### 1.1 Acceptable Integration Boundaries
Every external provider adapter must comply with the following boundaries:
1. **Official Open APIs**: Adapters may consume public, unauthenticated or OAuth-authenticated APIs (e.g., Open Library, MangaUpdates, AniList, Google Books, Crossref).
2. **Standard Feeds**: Adapters may parse public RSS/Atom feeds provided directly by publishers and web serial platforms.
3. **Passive Browser Session Bridge**: With the user's explicit consent via the browser extension, the application may read metadata from pages already open in the user's active browser tabs.
4. **Local Filesystem**: Adapters may parse, index, and organize files explicitly provided by the user on their local hard drives or network-attached storage.

### 1.2 Strictly Prohibited Practices
- **No Reverse-Engineering of Proprietary DRM**: The app must never bundle or invoke DeDRM tools, Kindle unpacking keys, or Widevine CDM decryptors.
- **No CAPTCHA Circumvention**: Adapters must never integrate anti-bot bypass services (e.g., 2Captcha, CapSolver, Flaresolverr). If an endpoint returns HTTP 403 or a Cloudflare Turnstile page, the adapter MUST immediately report `SourceHealthState.Degraded` and halt automated attempts.
- **No Scraping of Paywalled Content**: The application will not bypass paywalls, extract subscriber-only locked chapters, or spoof authentication headers to pirate media.
- **No Direct Mass Scraping**: Bulk crawling that places uncompensated load on independent author sites is prohibited.

---

## 2. API Versioning & Contracts

### 2.1 Backend HTTP API (FastAPI)
- **Base URI Path**: `/api/v1/`
- **Versioning Strategy**: Breaking schema changes require a new path increment (`/api/v2/`). Minor additive features are introduced backward-compatibly under `/v1/`.
- **Content Type**: `application/json; charset=utf-8`
- **Response Structure**:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "meta": {
      "timestamp": "2026-10-04T12:00:00Z",
      "requestId": "req_01HG..."
    }
  }
  ```

### 2.2 Native Plugin Boundary (Capacitor)
Native mobile capabilities must be exposed through explicitly selected Capacitor plugins, not an unrestricted JavaScript-to-native bridge:
- Keep the application-facing adapter narrow, typed, and permission-minimized.
- Validate every argument at the native boundary and return standardized payloads mapped to the TypeScript `Result<T, AppError>` union.
- Do not log passphrases, vault plaintext, file contents, or other sensitive values in either platform layer.
- Keep browser implementations behind the same adapter interfaces; native-only behavior must fail explicitly when unavailable.

---

## 3. Rate Limiting & Network Throttling

To prevent IP bans and respect web server capacities, all outgoing network requests pass through a centralized **Token Bucket Rate Limiter** residing in `@chronicles-vault/source`.

### 3.1 Rate Limit Rules
| Target Category | Max Sustained Rate | Max Burst | Default Backoff |
|---|---|---|---|
| Metadata Services (AniList, OpenLibrary) | 2 requests / sec | 5 requests | Exponential (1s -> 2s -> 4s) |
| Web Serial Feeds (RSS/Atom) | 1 request / 5 min | 1 request | Static 15 min |
| Cover Image Downloads | 4 requests / sec | 8 requests | 2s jittered |
| Health Check Ping | 1 request / hour | 1 request | 1 hour |

### 3.2 HTTP Request Standards
- **User-Agent**: Every request must send a transparent, non-deceptive User-Agent:
  `User-Agent: ChroniclesVault/1.0 (+https://chroniclesvault.app; contact@chroniclesvault.app)`
- **Conditional GETs**: Adapters must preserve `ETag` and `Last-Modified` headers in `sync_state`, sending `If-None-Match` and `If-Modified-Since` on subsequent requests to minimize bandwidth.

---

## 4. Error Handling Taxonomy & Result Pattern

### 4.1 The Result Type
Functions that can fail must return a `Result<T, E>` type rather than throwing unhandled exceptions:

```typescript
export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

### 4.2 Standard AppError Classes
```typescript
export type AppErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'VAULT_LOCKED'
  | 'AUTHENTICATION_FAILED'
  | 'RATE_LIMITED'
  | 'NETWORK_UNAVAILABLE'
  | 'SOURCE_DEGRADED'
  | 'STORAGE_ERROR'
  | 'INTERNAL_ERROR';

export interface AppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly cause?: unknown;
  readonly recoverable: boolean;
  readonly suggestedAction?: string;
}
```

---

## 5. Offline Resilience & Queueing

1. **Local-First Availability**: All reading, note-taking, shelf re-ordering, and progress tracking operations function seamlessly without an active internet connection.
2. **Offline Mutation Queue**: If a source sync or metadata enrichment task fails due to `NETWORK_UNAVAILABLE`, the action is enqueued in the SQLite `sync_state` table with a retry counter.
3. **Reconnection Flush**: When the network state listener reports online connectivity, the queue resumes in the background with randomized jitter.

---

## 6. Credential Management & Sync Policy

### 6.1 No Credential Synchronization
Chronicles Vault implements a strict **no-credential-sync** policy:

- **Passwords**: User passwords for third-party services are NEVER stored, transmitted, or synchronized.
- **API Keys**: API keys and tokens are stored locally only and are excluded from cloud synchronization.
- **Session Tokens**: Authentication session tokens are local-only and never synced to cloud servers.
- **OAuth Refresh Tokens**: Refresh tokens for OAuth-based integrations are stored locally with user consent and never included in sync payloads.

### 6.2 Cloud Sync Exclusions
When cloud synchronization is enabled (optional feature), the following data categories are **explicitly excluded** from synchronization:

- Vault encrypted data (remains local-only)
- Third-party service credentials and tokens
- API keys and authentication secrets
- OAuth refresh tokens
- Any encrypted session state

### 6.3 Provider Integration Authentication
When integrating with external providers:

1. **OAuth Flow**: Use standard OAuth 2.0 authorization code flow with PKCE where available. Tokens are stored in encrypted local storage.
2. **API Keys**: Users must manually enter API keys through the UI. Keys are encrypted at rest using the Vault encryption system.
3. **No Credential Harvesting**: The application will never silently harvest credentials from browser sessions, password managers, or external sources.
4. **Revocation Support**: Users can revoke access to any provider integration at any time, which immediately deletes all associated credentials from local storage.

### 6.4 Credential Storage Requirements
All credentials must satisfy these requirements:

- Encrypted at rest using AES-256-GCM
- Never written to logs, telemetry, or crash reports
- Never included in error messages or debugging output
- Accessible only through the Vault when unlocked
- Automatically cleared from memory when Vault is locked
- Never transmitted over unencrypted connections (HTTPS required)
