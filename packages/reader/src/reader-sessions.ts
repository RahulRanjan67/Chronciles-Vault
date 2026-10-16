import type { ProgressAnchor } from "@chronicles-vault/domain";

export interface ReaderSession {
  readonly id: string;
  readonly fileId: string;
  readonly workId: string | null;
  readonly startedAt: string;
  readonly lastActiveAt: string;
  readonly endedAt: string | null;
  readonly durationSeconds: number;
  readonly anchorBefore: ProgressAnchor | null;
  readonly anchorAfter: ProgressAnchor | null;
}

const DATABASE_NAME = "chronicles-vault-reader";
const DATABASE_VERSION = 4;
const FILE_STORE_NAME = "local-files";
const SESSION_STORE_NAME = "reading-sessions";
const PDF_BOOKMARK_STORE_NAME = "pdf-bookmarks";
const MEMORY_ASSET_STORE_NAME = "memory-assets";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Local reading-session storage is unavailable."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FILE_STORE_NAME)) {
        const files = database.createObjectStore(FILE_STORE_NAME, { keyPath: "id" });
        files.createIndex("contentHash", "contentHash", { unique: true });
      }
      if (!database.objectStoreNames.contains(SESSION_STORE_NAME)) {
        const sessions = database.createObjectStore(SESSION_STORE_NAME, { keyPath: "id" });
        sessions.createIndex("workId", "workId", { unique: false });
        sessions.createIndex("fileId", "fileId", { unique: false });
      }
      if (!database.objectStoreNames.contains(PDF_BOOKMARK_STORE_NAME)) {
        const bookmarks = database.createObjectStore(PDF_BOOKMARK_STORE_NAME, { keyPath: "id" });
        bookmarks.createIndex("fileId", "fileId", { unique: false });
      }
      if (!database.objectStoreNames.contains(MEMORY_ASSET_STORE_NAME)) {
        database.createObjectStore(MEMORY_ASSET_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open reading-session storage."));
    request.onblocked = () =>
      reject(new Error("Reading-session storage upgrade is blocked by another tab."));
  });
}

function elapsedSeconds(startedAt: string, endedAt: string): number {
  const elapsed = Date.parse(endedAt) - Date.parse(startedAt);
  if (!Number.isFinite(elapsed)) throw new Error("Reading session has an invalid timestamp.");
  return Math.max(0, Math.floor(elapsed / 1000));
}

export async function startReaderSession(
  fileId: string,
  workId: string | null,
  anchorBefore: ProgressAnchor | null,
  now = new Date(),
  id = crypto.randomUUID(),
): Promise<ReaderSession> {
  const startedAt = now.toISOString();
  const session: ReaderSession = {
    id,
    fileId,
    workId,
    startedAt,
    lastActiveAt: startedAt,
    endedAt: null,
    durationSeconds: 0,
    anchorBefore,
    anchorAfter: anchorBefore,
  };
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction([FILE_STORE_NAME, SESSION_STORE_NAME], "readwrite");
      const fileRequest = transaction.objectStore(FILE_STORE_NAME).get(fileId);
      let abortError: Error | undefined;
      fileRequest.onsuccess = () => {
        const file = fileRequest.result as { workId: string | null } | undefined;
        if (!file) {
          abortError = new Error("Cannot start a session for a missing local file.");
          transaction.abort();
          return;
        }
        if (file.workId !== workId) {
          abortError = new Error("Session Work does not match the local file link.");
          transaction.abort();
          return;
        }
        transaction.objectStore(SESSION_STORE_NAME).add(session);
      };
      fileRequest.onerror = () => transaction.abort();
      transaction.oncomplete = () => resolve(session);
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Unable to start the reader session."));
      transaction.onabort = () =>
        reject(abortError ?? transaction.error ?? new Error("Unable to start the reader session."));
    });
  } finally {
    database.close();
  }
}

export async function updateReaderSession(
  sessionId: string,
  anchorAfter: ProgressAnchor,
  now = new Date(),
): Promise<ReaderSession> {
  const lastActiveAt = now.toISOString();
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(SESSION_STORE_NAME, "readwrite");
      const store = transaction.objectStore(SESSION_STORE_NAME);
      const request = store.get(sessionId);
      let updated: ReaderSession | undefined;
      let abortError: Error | undefined;
      request.onsuccess = () => {
        const session = request.result as ReaderSession | undefined;
        if (!session) {
          abortError = new Error("Reader session was not found.");
          transaction.abort();
          return;
        }
        if (session.endedAt) {
          abortError = new Error("Reader session has already ended.");
          transaction.abort();
          return;
        }
        updated = {
          ...session,
          lastActiveAt,
          durationSeconds: elapsedSeconds(session.startedAt, lastActiveAt),
          anchorAfter,
        };
        store.put(updated);
      };
      request.onerror = () => transaction.abort();
      transaction.oncomplete = () => {
        if (updated) resolve(updated);
      };
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Unable to update the reader session."));
      transaction.onabort = () =>
        reject(
          abortError ?? transaction.error ?? new Error("Unable to update the reader session."),
        );
    });
  } finally {
    database.close();
  }
}

export async function endReaderSession(
  sessionId: string,
  anchorAfter: ProgressAnchor,
  now = new Date(),
): Promise<ReaderSession> {
  const endedAt = now.toISOString();
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(SESSION_STORE_NAME, "readwrite");
      const store = transaction.objectStore(SESSION_STORE_NAME);
      const request = store.get(sessionId);
      let ended: ReaderSession | undefined;
      let abortError: Error | undefined;
      request.onsuccess = () => {
        const session = request.result as ReaderSession | undefined;
        if (!session) {
          abortError = new Error("Reader session was not found.");
          transaction.abort();
          return;
        }
        if (session.endedAt) {
          abortError = new Error("Reader session has already ended.");
          transaction.abort();
          return;
        }
        ended = {
          ...session,
          lastActiveAt: endedAt,
          endedAt,
          durationSeconds: elapsedSeconds(session.startedAt, endedAt),
          anchorAfter,
        };
        store.put(ended);
      };
      request.onerror = () => transaction.abort();
      transaction.oncomplete = () => {
        if (ended) resolve(ended);
      };
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Unable to end the reader session."));
      transaction.onabort = () =>
        reject(abortError ?? transaction.error ?? new Error("Unable to end the reader session."));
    });
  } finally {
    database.close();
  }
}

export async function listReaderSessions(workId: string): Promise<ReaderSession[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const store = database
        .transaction(SESSION_STORE_NAME, "readonly")
        .objectStore(SESSION_STORE_NAME);
      const request = store.index("workId").getAll(workId);
      request.onsuccess = () => resolve(request.result as ReaderSession[]);
      request.onerror = () => reject(request.error ?? new Error("Unable to list reader sessions."));
    });
  } finally {
    database.close();
  }
}
