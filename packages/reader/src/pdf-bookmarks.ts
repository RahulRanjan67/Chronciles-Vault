export interface PdfBookmark {
  readonly id: string;
  readonly fileId: string;
  readonly pageNumber: number;
  readonly title: string;
  readonly createdAt: string;
}

const DATABASE_NAME = "chronicles-vault-reader";
const DATABASE_VERSION = 4;
const FILE_STORE_NAME = "local-files";
const SESSION_STORE_NAME = "reading-sessions";
const BOOKMARK_STORE_NAME = "pdf-bookmarks";
const MEMORY_ASSET_STORE_NAME = "memory-assets";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Local PDF bookmark storage is unavailable."));
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
      if (!database.objectStoreNames.contains(BOOKMARK_STORE_NAME)) {
        const bookmarks = database.createObjectStore(BOOKMARK_STORE_NAME, { keyPath: "id" });
        bookmarks.createIndex("fileId", "fileId", { unique: false });
      }
      if (!database.objectStoreNames.contains(MEMORY_ASSET_STORE_NAME)) {
        database.createObjectStore(MEMORY_ASSET_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open PDF bookmarks."));
    request.onblocked = () => reject(new Error("PDF bookmark storage upgrade is blocked."));
  });
}

function bookmarkId(fileId: string, pageNumber: number): string {
  return `${fileId}:${pageNumber}`;
}

export async function listPdfBookmarks(fileId: string): Promise<PdfBookmark[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(BOOKMARK_STORE_NAME, "readonly")
        .objectStore(BOOKMARK_STORE_NAME)
        .index("fileId")
        .getAll(fileId);
      request.onsuccess = () =>
        resolve((request.result as PdfBookmark[]).sort((a, b) => a.pageNumber - b.pageNumber));
      request.onerror = () => reject(request.error ?? new Error("Unable to list PDF bookmarks."));
    });
  } finally {
    database.close();
  }
}

export async function togglePdfBookmark(
  fileId: string,
  pageNumber: number,
  totalPages: number,
  now = new Date(),
): Promise<PdfBookmark | null> {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
    throw new Error("PDF bookmark page must be within the document.");
  }
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction([FILE_STORE_NAME, BOOKMARK_STORE_NAME], "readwrite");
      const files = transaction.objectStore(FILE_STORE_NAME);
      const bookmarks = transaction.objectStore(BOOKMARK_STORE_NAME);
      const fileRequest = files.get(fileId);
      const id = bookmarkId(fileId, pageNumber);
      let changed: PdfBookmark | null = null;
      let abortError: Error | undefined;
      fileRequest.onsuccess = () => {
        if (fileRequest.result?.format !== "pdf") {
          abortError = new Error("Cannot bookmark a missing local PDF.");
          transaction.abort();
          return;
        }
        const bookmarkRequest = bookmarks.get(id);
        bookmarkRequest.onsuccess = () => {
          if (bookmarkRequest.result) {
            bookmarks.delete(id);
            changed = null;
            return;
          }
          changed = {
            id,
            fileId,
            pageNumber,
            title: `Page ${pageNumber}`,
            createdAt: now.toISOString(),
          };
          bookmarks.add(changed);
        };
        bookmarkRequest.onerror = () => transaction.abort();
      };
      fileRequest.onerror = () => transaction.abort();
      transaction.oncomplete = () => resolve(changed);
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Unable to update the PDF bookmark."));
      transaction.onabort = () =>
        reject(abortError ?? transaction.error ?? new Error("Unable to update the PDF bookmark."));
    });
  } finally {
    database.close();
  }
}
