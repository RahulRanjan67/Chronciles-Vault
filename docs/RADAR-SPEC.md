# Chronicles Vault — Radar Browser Companion Protocol Specification
Version: 1.0.0  
Status: Authoritative Architecture Contract  
Target Cycle: Cycle 2 (Browser Extension Ingestion)  

---

## 1. Overview & Architectural Role

**Radar** is the official browser companion extension (Chromium Manifest V3 and Firefox WebExtensions) for Chronicles Vault. Its primary mission is to capture fiction reading tabs, articles, webtoons, light novels, and bookmark hierarchies from the browser and ingest them into Chronicles Vault without cluttering the user's permanent library with unvetted tabs, and without violating privacy boundaries.

Radar operates according to the **Triage Queue Architecture**: raw browser captures are stored as prospective intake items (`captures` table) rather than directly creating unverified `Work` entities.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Browser (Chromium / Firefox)                       │
│                                                                        │
│   Active Tabs ───> [Radar Extension Popup / Content Scripts]          │
│                               │                                        │
│                     [Background Service Worker]                        │
│                               │                                        │
│                      IndexedDB Offline Queue                           │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               │ Primary:                        │ Secondary / Fallback:
               │ Native Messaging Host Port      │ Local HTTP Bridge
               │ (chrome.runtime.connectNative)  │ POST 127.0.0.1:41777/api/v1/capture
               └────────────────┬────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────────┐
│                   Chronicles Vault Desktop / API                       │
│                                                                        │
│   1. Loopback Origin Gate (CORS / Local-only IP)                       │
│   2. Bearer Token Auth (Constant-Time Verification)                    │
│   3. Leaky-Bucket Rate Limiter (30 req/min burst)                      │
│   4. Deduplication & Canonicalization Pipeline                         │
│   5. Staging SQLite Database (`captures` & `capture_batches`)         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Communication Channels & Port Protocol

Radar supports two transport layers arranged in strict priority:

### 2.1 Transport A: Native Messaging Host (Primary for Desktop Shell)
When a supported desktop native-messaging host is available, Radar may connect to its registered host binary. Capacitor mobile builds do not provide this desktop transport; use the explicitly initiated JSON file handoff there unless a separately reviewed mobile transport is implemented.

- **Host Identifier**: `com.chroniclesvault.radar`
- **OS Manifest Registrations**:
  - **Windows (Registry)**: `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.chroniclesvault.radar`  
    Points to manifest JSON path (e.g. `%LOCALAPPDATA%\ChroniclesVault\radar-host.json`).
  - **macOS**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.chroniclesvault.radar.json`
  - **Linux**: `~/.config/google-chrome/NativeMessagingHosts/com.chroniclesvault.radar.json`
- **Framing Protocol**: Standard WebExtension framing:
  - 32-bit unsigned little-endian integer prefix specifying payload length in bytes.
  - UTF-8 JSON payload up to a strict maximum of **4,194,304 bytes (4 MB)**.
- **Port Lifecycle**:
  ```typescript
  // Background Service Worker: chrome.runtime.connectNative
  let nativePort: chrome.runtime.Port | null = null;

  function connectNativeHost(): chrome.runtime.Port {
    nativePort = chrome.runtime.connectNative('com.chroniclesvault.radar');
    
    nativePort.onMessage.addListener((message: RadarMessage) => {
      handleIncomingDesktopMessage(message);
    });

    nativePort.onDisconnect.addListener(() => {
      const err = chrome.runtime.lastError;
      console.warn('Native host disconnected:', err?.message);
      nativePort = null;
      scheduleReconnection();
    });

    return nativePort;
  }
  ```

### 2.2 Transport B: Local HTTP Bridge (Headless / Web Client Fallback)
When the Native Messaging host is not available (e.g. running in browser-only dev mode or headless server), Radar communicates with the local REST daemon.

- **Endpoint**: `http://127.0.0.1:41777/api/v1/capture`
- **Host Binding**: Strictly bound to `127.0.0.1` and `[::1]`. Connections from non-loopback network interfaces are dropped at socket level.
- **Host Header Enforcement**: The server validates the HTTP `Host` header. Requests with host headers other than `127.0.0.1:41777` or `localhost:41777` receive `403 Forbidden` (mitigating DNS rebinding attacks).
- **CORS Configuration**:
  ```http
  Access-Control-Allow-Origin: chrome-extension://<EXTENSION_ID>
  Access-Control-Allow-Methods: POST, GET, OPTIONS
  Access-Control-Allow-Headers: Authorization, Content-Type, X-Radar-Version
  Access-Control-Max-Age: 86400
  ```
  The server explicitly matches against configured extension IDs for Chromium (`chrome-extension://*`) and Firefox (`moz-extension://*`). Wildcard `*` origins are strictly forbidden.

### 2.3 Reconnection & Jittered Backoff
If the connection is severed, the extension service worker enters a retry state:
$$\text{Delay} = \min(30000, 1000 \times 2^{\text{attempt}}) + \text{random}(0, 500)\text{ ms}$$

- Attempt 1: ~1.2s  
- Attempt 2: ~2.4s  
- Attempt 3: ~4.3s  
- Attempt 4: ~8.1s  
- Attempt 5+: Cap at 30s with jitter  

Captures occurring while offline are enqueued into IndexedDB (`radar_offline_queue`) and drained automatically when connection is restored.

---

## 3. Token Authentication & Pairing Protocol

To prevent malicious local software from submitting unauthorized data to Chronicles Vault, Radar enforces cryptographic bearer pairing.

### 3.1 Key Generation & Storage
1. **Secret Generation**: On first run, Chronicles Vault creates a cryptographically secure 256-bit authentication token:
   $$\text{Token} = \text{CSPRNG}(32\text{ bytes}) \xrightarrow{\text{hex}} 64\text{ hexadecimal characters}$$
2. **Storage in Vault**: Stored in the local database table `app_settings` under key `radar.auth_token`.
3. **Storage in Extension**: Stored in `chrome.storage.local` encrypted using browser profile storage.

### 3.2 Mutual Pairing Handshake
```
User / Desktop App                                   Radar Extension
       │                                                    │
       │  1. Displays QR Code / Hex Token in Settings       │
       │     (or sends auto-pair via Native Messaging)      │
       │───────────────────────────────────────────────────>│
       │                                                    │  2. Stores token in
       │                                                    │     chrome.storage.local
       │  3. POST /api/v1/capture/handshake                 │
       │     Headers: Authorization: Bearer <TOKEN>         │
       │<───────────────────────────────────────────────────│
       │                                                    │
       │  4. Constant-Time Verification                     │
       │     (timingSafeEqual)                              │
       │  5. 200 OK { paired: true, appVersion: "1.0.0" }   │
       │───────────────────────────────────────────────────>│
```

### 3.3 Timing-Safe Verification Implementation
Verification in the local server uses constant-time byte comparisons to prevent timing side-channel attacks:

```typescript
import { timingSafeEqual } from 'node:crypto';

export function verifyRadarToken(providedHeader: string | undefined, expectedToken: string): boolean {
  if (!providedHeader || !providedHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = providedHeader.slice(7).trim();
  const tokenBuf = Buffer.from(token, 'utf-8');
  const expectedBuf = Buffer.from(expectedToken, 'utf-8');

  if (tokenBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(tokenBuf, expectedBuf);
}
```

---

## 4. Complete Message Schemas (TypeScript Contract)

All messages exchanged over Native Messaging ports or WebSockets wrap inside a standard envelope.

### 4.1 Base Envelope
```typescript
export type RadarProtocolVersion = '1.0.0';

export interface RadarEnvelope<TType extends string, TPayload> {
  readonly version: RadarProtocolVersion;
  readonly messageId: string;       // UUID v4
  readonly timestamp: string;       // ISO 8601 UTC string
  readonly type: TType;
  readonly payload: TPayload;
}
```

### 4.2 Message Types Catalog

#### 1. `RADAR_PING` / `RADAR_PONG`
```typescript
export type RadarPingMessage = RadarEnvelope<'RADAR_PING', {
  readonly clientTimestamp: string;
  readonly extensionVersion: string;
  readonly browser: 'chromium' | 'firefox' | 'edge' | 'safari';
}>;

export type RadarPongMessage = RadarEnvelope<'RADAR_PONG', {
  readonly serverTimestamp: string;
  readonly appVersion: string;
  readonly vaultLocked: boolean;
  readonly activeTrackedWorksCount: number;
}>;
```

#### 2. `CAPTURE_SINGLE_TAB`
Captures the currently active tab with rich DOM reader metadata:
```typescript
export type CaptureSingleTabMessage = RadarEnvelope<'CAPTURE_SINGLE_TAB', {
  readonly url: string;
  readonly title: string;
  readonly faviconUrl?: string;
  readonly windowId: number;
  readonly tabId: number;
  
  // Reader Content Extraction (from content script)
  readonly readerMetadata?: {
    readonly metaDescription?: string;
    readonly author?: string;
    readonly canonicalUrl?: string;
    readonly estimatedChapter?: number;
    readonly estimatedVolume?: number;
    readonly totalChapters?: number;
    readonly scrollPercentage?: number;   // 0.0 to 100.0
    readonly domWordCount?: number;
    readonly detectedFormat?: 'manga' | 'webtoon' | 'novel' | 'article';
  };

  // User Highlight / Selected Quote (optional)
  readonly excerpt?: {
    readonly text: string;
    readonly cfiOrSelector?: string;
    readonly capturedAt: string;
  };

  // Target Work Assignment (if matched in extension popup)
  readonly targetWorkId?: string;
}>;
```

#### 3. `CAPTURE_WINDOW_BATCH`
Sweeps all open tabs across a window into a structured session batch:
```typescript
export interface CapturedTabItem {
  readonly tabId: number;
  readonly index: number;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl?: string;
  readonly isPinned: boolean;
  readonly lastActiveAt?: string;
}

export type CaptureWindowBatchMessage = RadarEnvelope<'CAPTURE_WINDOW_BATCH', {
  readonly batchId: string;               // UUID v4 generated by extension
  readonly batchLabel: string;            // e.g. "Manga Reading Session (18 tabs)"
  readonly windowId: number;
  readonly tabCount: number;
  readonly tabs: readonly CapturedTabItem[];
  readonly autoCloseTabsAfterCapture: boolean;
}>;
```

#### 4. `CAPTURE_BOOKMARK_FOLDER`
Recursively exports a browser bookmark folder:
```typescript
export interface BookmarkTreeNode {
  readonly id: string;
  readonly title: string;
  readonly url?: string;                  // Leaf bookmark
  readonly dateAdded?: number;            // Unix timestamp ms
  readonly children?: readonly BookmarkTreeNode[]; // Sub-folder
}

export type CaptureBookmarkFolderMessage = RadarEnvelope<'CAPTURE_BOOKMARK_FOLDER', {
  readonly rootFolderTitle: string;
  readonly totalBookmarksCount: number;
  readonly tree: BookmarkTreeNode;
}>;
```

#### 5. `QUERY_WORK_STATUS` & `WORK_STATUS_RESPONSE`
Allows the browser extension popup to indicate whether the open tab corresponds to an existing library `Work`:
```typescript
export type QueryWorkStatusMessage = RadarEnvelope<'QUERY_WORK_STATUS', {
  readonly url: string;
  readonly pageTitle: string;
}>;

export type WorkStatusResponseMessage = RadarEnvelope<'WORK_STATUS_RESPONSE', {
  readonly url: string;
  readonly isTracked: boolean;
  readonly matchConfidence: number;        // 0.0 to 1.0
  readonly matchedWork?: {
    readonly id: string;
    readonly title: string;
    readonly contentType: string;
    readonly coverImageRef?: string;
    readonly personalState: string;
    readonly currentAnchorLabel: string;
    readonly currentAnchorValue: number | string;
    readonly lastReadAt: string;
  };
}>;
```

#### 6. `CAPTURE_ACK` & `CAPTURE_ERROR`
```typescript
export type CaptureAckMessage = RadarEnvelope<'CAPTURE_ACK', {
  readonly originalMessageId: string;
  readonly captureIds: readonly string[];
  readonly batchId?: string;
  readonly autoMatchedWorkCount: number;
  readonly pendingReviewCount: number;
}>;

export type RadarErrorCode = 
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'MALFORMED_PAYLOAD'
  | 'PAYLOAD_TOO_LARGE'
  | 'STORAGE_FULL'
  | 'INTERNAL_ERROR';

export type CaptureErrorMessage = RadarEnvelope<'CAPTURE_ERROR', {
  readonly originalMessageId?: string;
  readonly code: RadarErrorCode;
  readonly message: string;
  readonly retryAfterSeconds?: number;
}>;
```

---

## 5. Local Server REST API: `/api/v1/capture`

### 5.1 Route Definitions
- **`POST /api/v1/capture`**: Ingest a single tab or quote capture.
- **`POST /api/v1/capture/batch`**: Ingest a multi-tab window or bookmark tree.
- **`GET /api/v1/capture/status?url=<ENCODED_URL>`**: Query tracking status.
- **`POST /api/v1/capture/handshake`**: Exchange and verify auth token.

### 5.2 Single Capture Request Specification
```http
POST /api/v1/capture HTTP/1.1
Host: 127.0.0.1:41777
Authorization: Bearer 4a2f8b9e...01c8
Content-Type: application/json
X-Radar-Version: 1.0.0

{
  "version": "1.0.0",
  "messageId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-10-04T12:00:00.000Z",
  "type": "CAPTURE_SINGLE_TAB",
  "payload": {
    "url": "https://example-manga.com/series/frieren/chapter-120",
    "title": "Sousou no Frieren - Chapter 120",
    "readerMetadata": {
      "estimatedChapter": 120,
      "detectedFormat": "manga",
      "scrollPercentage": 45.2
    }
  }
}
```

### 5.3 Response Codes & Payloads
- **`201 Created`**: Capture enqueued successfully.
  ```json
  {
    "success": true,
    "captureId": "cap_8f7b3a9c",
    "status": "pending_triage",
    "matchedWorkId": "work_102",
    "matchedConfidence": 0.94
  }
  ```
- **`400 Bad Request`**: Malformed payload or validation error.
- **`401 Unauthorized`**: Missing or invalid bearer token.
- **`429 Too Many Requests`**: Rate limit exceeded. Returns `Retry-After: <seconds>`.
- **`503 Service Unavailable`**: Vault locked in non-memory mode or disk full.

---

## 6. Rate Limiting Architecture

To guard against malicious extensions or runaway loops, the local endpoint implements a **Leaky-Bucket Rate Limiter**:

- **Burst Capacity**: 30 requests.
- **Refill Rate**: 1 token per 2.0 seconds (30 req / minute steady state).
- **Batch Endpoint Capacity**: 5 batch requests per minute (with up to 100 tabs per batch).
- **HTTP Response Headers**:
  ```http
  X-RateLimit-Limit: 30
  X-RateLimit-Remaining: 18
  X-RateLimit-Reset: 1728043200
  ```
- **Handling 429 in Extension**:
  When receiving `429 Too Many Requests`, the extension parses `Retry-After` (or defaults to 10 seconds), pauses queue processing, and displays a yellow throttle badge on the extension action icon.

---

## 7. Deduplication & Canonicalization Pipeline

The deduplication pipeline guarantees that sweeping the same window or visiting the same chapter multiple times does not produce duplicate entries:

```
Incoming URL
     │
     ▼
[Stage 1: Parameter Scrubbing] ──> Strips 35+ tracking & session parameters
     │
     ▼
[Stage 2: Canonical Normalization] ──> Normalizes scheme, port, casing, path slashes
     │
     ▼
[Stage 3: Fast Hash Lookup] ──> SHA-256(canonical_url) queried against `captures` table
     │
     ├── Match Found within 24h: Update `last_seen_at`, bump count, suppress duplicate
     └── No Match: Proceed to Stage 4
     │
     ▼
[Stage 4: AccessPath Cross-Check] ──> Compare URL against registered `access_paths`
     │
     ├── Matches Work AccessPath: Auto-link to existing Work ID with 1.0 confidence
     └── No Match: Proceed to Stage 5
     │
     ▼
[Stage 5: Fuzzy Title Matcher] ──> Clean title (strip chapter numbers & scans credits)
     │                             Trigram similarity against library Work titles
     │
     ├── Similarity >= 0.85: Auto-suggest Work match in triage queue
     └── Similarity < 0.85: Stage as standalone unclassified capture
```

### 7.1 Parameter Scrubbing Deny-List
The following URL query parameters are automatically stripped before canonical hashing:
- **Analytics & Campaigns**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`
- **Ad Tracking & Click IDs**: `gclid`, `fbclid`, `msclkid`, `twclid`, `ttclid`, `yclid`, `dclid`
- **Social & Affiliate Referrals**: `ref`, `referrer`, `source`, `spm`, `igshid`, `aff`, `affiliate`
- **Session & Cache Busters**: `session_id`, `jsessionid`, `phpsessid`, `_`, `v`, `t`, `timestamp`

### 7.2 Title Cleaning Regex
Before title matching, noise tokens are excised:
```typescript
export function cleanReadingTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\[(?:Read Online|Scanlation|English|Full).*?\]/gi, '')
    .replace(/\((?:Chapter|Ch\.|Episode|Ep\.).*?\)/gi, '')
    .replace(/(?:Chapter|Ch\.|Episode|Ep\.)\s*\d+(?:\.\d+)?/gi, '')
    .replace(/\|\s*(?:Read Manga|Webtoon Hub|Comic Reader).*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

## 8. Failure Modes & Offline Resilience

1. **Vault Locked**: Captures submitted while the Private Vault is locked are held in the unencrypted staging table `captures` with metadata only. They are NEVER rejected; the user triages them once unlocked.
2. **Browser Closed During Batch**: The extension stores active batches in IndexedDB with state `in_flight`. On next browser startup, incomplete batches resume gracefully.
3. **Database Busy / Locked**: The server queues writes in an in-memory ring buffer (up to 1,000 items) and retries within SQLite busy-timeout limits (5,000ms).
