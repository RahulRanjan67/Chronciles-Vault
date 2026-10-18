# Chronicles Vault — Domain Events Specification

## 1. Event Bus Architecture & Semantics

Chronicles Vault uses an asynchronous, decoupled event-driven communication model to keep UI stores, background synchronization, search indexing, and security subsystems synchronized without tight coupling.

### 1.1 Guiding Principles
- **Event Immutability**: Domain events represent facts that have already occurred. Once emitted, payload fields are strictly `readonly`.
- **Envelope Standard**: Every event conforms to the `DomainEvent<T>` envelope containing metadata (id, timestamp, correlation id, actor).
- **Dual Dispatch**: Events are dispatched in-memory across TypeScript subscribers (Zustand stores, UI listeners) and selectively bridged through approved Capacitor plugin events and persisted to the SQLite `event_log` table.
- **Privacy Boundary**: Events containing `vault`-classified information MUST NOT be written to plaintext logs or transmitted unencrypted across insecure boundaries.

---

## 2. Event Envelope Definition

```typescript
export interface EventMetadata {
  /** Unique UUID v4 identifying this specific event instance. */
  readonly eventId: string;
  /** ISO 8601 UTC timestamp when the event was generated. */
  readonly timestamp: string;
  /** Correlating trace ID for chained operations. */
  readonly correlationId?: string;
  /** Origin device or window identifier. */
  readonly deviceId?: string;
  /** Origin client subsystem: 'ui' | 'vault' | 'source_sync' | 'extension' | 'reader'. */
  readonly source: string;
}

export interface DomainEvent<TType extends string, TPayload> {
  readonly type: TType;
  readonly meta: EventMetadata;
  readonly payload: TPayload;
}
```

---

## 3. Exhaustive Domain Event Catalog

### 3.1 Work Events

#### `work:created`
Emitted immediately after a new `Work` aggregate is persisted to storage.
```typescript
export type WorkCreatedEvent = DomainEvent<'work:created', {
  readonly workId: WorkId;
  readonly title: string;
  readonly contentType: ContentType;
  readonly privacyState: PrivacyState;
  readonly initialAccessPathId?: AccessPathId;
}>;
```

#### `work:updated`
Emitted when metadata (title, aliases, description, cover) is altered.
```typescript
export type WorkUpdatedEvent = DomainEvent<'work:updated', {
  readonly workId: WorkId;
  readonly changedFields: readonly string[];
  readonly previousValues: Partial<Record<string, unknown>>;
  readonly currentValues: Partial<Record<string, unknown>>;
}>;
```

#### `work:deleted`
Emitted when a work is soft-deleted or permanently removed.
```typescript
export type WorkDeletedEvent = DomainEvent<'work:deleted', {
  readonly workId: WorkId;
  readonly isPermanent: boolean;
  readonly deletedAt: string;
}>;
```

#### `work:archived`
Emitted when a work is transferred to the historical archive with a stated reason.
```typescript
export type WorkArchivedEvent = DomainEvent<'work:archived', {
  readonly workId: WorkId;
  readonly archiveRecordId: ArchiveRecordId;
  readonly reason: string;
  readonly note?: string;
}>;
```

---

### 3.2 Reading & Progress Events

#### `reading:state_changed`
Emitted when the reader changes their personal state (e.g., `planned` -> `reading`, `reading` -> `completed`).
```typescript
export type ReadingStateChangedEvent = DomainEvent<'reading:state_changed', {
  readonly workId: WorkId;
  readonly readingRelationshipId: ReadingRelationshipId;
  readonly previousState: PersonalState;
  readonly newState: PersonalState;
  readonly reason?: string;
}>;
```

#### `reading:progress_updated`
Emitted when reading position moves (via reader scroll, chapter next, manual tick, or extension sync).
```typescript
export type ProgressUpdatedEvent = DomainEvent<'reading:progress_updated', {
  readonly workId: WorkId;
  readonly readingRelationshipId: ReadingRelationshipId;
  readonly accessPathId?: AccessPathId;
  readonly method: 'manual' | 'sync' | 'inferred' | 'imported';
  readonly confidence: 'confirmed' | 'estimated' | 'inferred';
  readonly anchorBefore?: ProgressAnchor;
  readonly anchorAfter: ProgressAnchor;
}>;
```

#### `reading:session_started` & `reading:session_ended`
Emitted when an active reading session begins or concludes, measuring velocity and time-on-page.
```typescript
export type ReadingSessionStartedEvent = DomainEvent<'reading:session_started', {
  readonly sessionId: ReadingSessionId;
  readonly workId: WorkId;
  readonly accessPathId?: AccessPathId;
  readonly startedAt: string;
  readonly initialAnchor: ProgressAnchor;
}>;

export type ReadingSessionEndedEvent = DomainEvent<'reading:session_ended', {
  readonly sessionId: ReadingSessionId;
  readonly workId: WorkId;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly durationSeconds: number;
  readonly anchorBefore: ProgressAnchor;
  readonly anchorAfter: ProgressAnchor;
}>;
```

---

### 3.3 Memory & Annotation Events

#### `memory:created`
Emitted when a quote, highlight, review, or thought is registered.
```typescript
export type MemoryCreatedEvent = DomainEvent<'memory:created', {
  readonly memoryId: MemoryId;
  readonly workId?: WorkId;
  readonly type: MemoryType;
  readonly privacyState: PrivacyState;
  readonly hasAssets: boolean;
  readonly progressAnchor?: ProgressAnchor;
}>;
```

#### `memory:updated`
Emitted when text, tags, or spoiler status are edited.
```typescript
export type MemoryUpdatedEvent = DomainEvent<'memory:updated', {
  readonly memoryId: MemoryId;
  readonly updatedFields: readonly string[];
}>;
```

#### `memory:deleted`
Emitted when a memory or highlight is deleted.
```typescript
export type MemoryDeletedEvent = DomainEvent<'memory:deleted', {
  readonly memoryId: MemoryId;
  readonly workId?: WorkId;
}>;
```

---

### 3.4 Access Path & Source Events

#### `source:health_changed`
Emitted when background health checking detects that a provider or local file has changed status.
```typescript
export type SourceHealthChangedEvent = DomainEvent<'source:health_changed', {
  readonly accessPathId: AccessPathId;
  readonly workId: WorkId;
  readonly previousState: SourceHealthState;
  readonly newState: SourceHealthState;
  readonly errorMessage?: string;
}>;
```

#### `source:update_detected`
Emitted when a new chapter, volume, or translation is discovered by a provider polling loop.
```typescript
export type UpdateDetectedEvent = DomainEvent<'source:update_detected', {
  readonly workId: WorkId;
  readonly accessPathId: AccessPathId;
  readonly updateEntry: UpdateEntry;
}>;
```

#### `source:sync_completed`
Emitted when an AccessPath sync loop completes.
```typescript
export type SourceSyncCompletedEvent = DomainEvent<'source:sync_completed', {
  readonly accessPathId: AccessPathId;
  readonly workId: WorkId;
  readonly itemsFetched: number;
  readonly durationMs: number;
  readonly nextSyncAt?: string;
}>;
```

---

### 3.5 Vault & Security Events

#### `vault:unlocked`
Emitted when the user provides the correct master passphrase and cryptographic keys are loaded in memory.
```typescript
export type VaultUnlockedEvent = DomainEvent<'vault:unlocked', {
  readonly sessionDurationMs: number;
  readonly unlockedAt: string;
}>;
```

#### `vault:locked`
Emitted when the user manually locks the vault, or auto-lock timeout triggers, or application terminates.
```typescript
export type VaultLockedEvent = DomainEvent<'vault:locked', {
  readonly reason: 'user_initiated' | 'timeout' | 'system_sleep' | 'auth_failure';
  readonly lockedAt: string;
}>;
```

#### `vault:password_changed`
Emitted when master key re-wrapping completes successfully.
```typescript
export type VaultPasswordChangedEvent = DomainEvent<'vault:password_changed', {
  readonly changedAt: string;
}>;
```

---

### 3.6 Capture & Extension Events

#### `capture:received`
Emitted when the browser extension or system clipboard sends a candidate page/bookmark to the app.
```typescript
export type CaptureReceivedEvent = DomainEvent<'capture:received', {
  readonly captureId: CaptureId;
  readonly batchId?: CaptureBatchId;
  readonly url?: string;
  readonly title?: string;
  readonly browser?: string;
}>;
```

#### `capture:resolved`
Emitted when a captured item is processed into a Work or dismissed.
```typescript
export type CaptureResolvedEvent = DomainEvent<'capture:resolved', {
  readonly captureId: CaptureId;
  readonly resolution: 'matched' | 'created_work' | 'dismissed';
  readonly workId?: WorkId;
}>;
```

---

## 4. Discriminated Union of All Events

```typescript
export type AppDomainEvent =
  | WorkCreatedEvent
  | WorkUpdatedEvent
  | WorkDeletedEvent
  | WorkArchivedEvent
  | ReadingStateChangedEvent
  | ProgressUpdatedEvent
  | ReadingSessionStartedEvent
  | ReadingSessionEndedEvent
  | MemoryCreatedEvent
  | MemoryUpdatedEvent
  | MemoryDeletedEvent
  | SourceHealthChangedEvent
  | UpdateDetectedEvent
  | SourceSyncCompletedEvent
  | VaultUnlockedEvent
  | VaultLockedEvent
  | VaultPasswordChangedEvent
  | CaptureReceivedEvent
  | CaptureResolvedEvent;
```
