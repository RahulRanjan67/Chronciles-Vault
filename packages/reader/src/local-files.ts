export type LocalFileFormat = "epub" | "pdf" | "cbz";

export interface LocalFileMetadata {
  readonly id: string;
  readonly displayName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly contentHash: string;
  readonly format: LocalFileFormat;
  readonly modifiedAt: string;
  readonly importedAt: string;
  readonly workId: string | null;
}

export interface StoredLocalFile extends LocalFileMetadata {
  readonly blob: Blob;
}

const MAX_LOCAL_FILE_BYTES = 128 * 1024 * 1024;
const DATABASE_NAME = "chronicles-vault-reader";
const DATABASE_VERSION = 4;
const STORE_NAME = "local-files";
const SESSION_STORE_NAME = "reading-sessions";
const PDF_BOOKMARK_STORE_NAME = "pdf-bookmarks";
const MEMORY_ASSET_STORE_NAME = "memory-assets";

const FORMAT_MIME: Record<LocalFileFormat, string> = {
  epub: "application/epub+zip",
  pdf: "application/pdf",
  cbz: "application/vnd.comicbook+zip",
};

function getFormat(fileName: string): LocalFileFormat {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "epub" || extension === "pdf" || extension === "cbz") return extension;
  throw new Error("Choose an EPUB, PDF, or CBZ file.");
}

function hasZipSignature(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    ((bytes[2] === 0x03 && bytes[3] === 0x04) ||
      (bytes[2] === 0x05 && bytes[3] === 0x06) ||
      (bytes[2] === 0x07 && bytes[3] === 0x08))
  );
}

function isEpub(bytes: Uint8Array): boolean {
  if (bytes.length < 38 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false;
  const compressionMethod = bytes[8] | (bytes[9] << 8);
  const compressedSize = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
  const fileNameLength = bytes[26] | (bytes[27] << 8);
  const extraLength = bytes[28] | (bytes[29] << 8);
  const nameStart = 30;
  const dataStart = nameStart + fileNameLength + extraLength;
  if (
    compressionMethod !== 0 ||
    compressedSize !== 20 ||
    dataStart + compressedSize > bytes.length
  ) {
    return false;
  }
  const firstEntry = new TextDecoder().decode(
    bytes.subarray(nameStart, nameStart + fileNameLength),
  );
  const mimetype = new TextDecoder().decode(bytes.subarray(dataStart, dataStart + compressedSize));
  return firstEntry === "mimetype" && mimetype === "application/epub+zip";
}

async function inspectFileSignature(file: File, format: LocalFileFormat): Promise<string> {
  const bytes = new Uint8Array(await file.slice(0, 128).arrayBuffer());
  if (format === "pdf") {
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
      throw new Error("The selected file does not contain a valid PDF signature.");
    }
    return FORMAT_MIME.pdf;
  }
  if (format === "epub") {
    if (!isEpub(bytes)) {
      throw new Error("The selected file is not a valid EPUB package.");
    }
    return FORMAT_MIME.epub;
  }
  if (!hasZipSignature(bytes)) {
    throw new Error("The selected file does not contain a valid CBZ ZIP signature.");
  }
  return FORMAT_MIME.cbz;
}

export async function inspectLocalFile(
  file: File,
  cryptoProvider: Pick<Crypto, "subtle" | "randomUUID"> = globalThis.crypto,
  now = new Date(),
): Promise<StoredLocalFile> {
  if (file.size <= 0) throw new Error("The selected file is empty.");
  if (file.size > MAX_LOCAL_FILE_BYTES) {
    throw new Error("Local files must be 128 MB or smaller.");
  }

  const format = getFormat(file.name);
  const mimeType = await inspectFileSignature(file, format);
  const bytes = await file.arrayBuffer();
  const digest = await cryptoProvider.subtle.digest("SHA-256", bytes);
  const contentHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const importedAt = now.toISOString();

  return {
    id: cryptoProvider.randomUUID(),
    displayName: file.name,
    mimeType,
    sizeBytes: file.size,
    contentHash,
    format,
    modifiedAt: new Date(file.lastModified).toISOString(),
    importedAt,
    workId: null,
    blob: file,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Local file storage is unavailable in this browser."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("contentHash", "contentHash", { unique: true });
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
      reject(request.error ?? new Error("Unable to open local file storage."));
    request.onblocked = () =>
      reject(new Error("Local file storage upgrade is blocked by another tab."));
  });
}

function metadataFromStored(file: StoredLocalFile): LocalFileMetadata {
  const { blob: _blob, ...metadata } = file;
  return metadata;
}

export async function importLocalFile(file: File): Promise<LocalFileMetadata> {
  const inspected = await inspectLocalFile(file);
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const duplicateRequest = store.index("contentHash").get(inspected.contentHash);
      let duplicate = false;
      duplicateRequest.onsuccess = () => {
        if (duplicateRequest.result) {
          duplicate = true;
          transaction.abort();
          return;
        }
        store.add(inspected);
      };
      duplicateRequest.onerror = () => transaction.abort();
      transaction.oncomplete = () => resolve(metadataFromStored(inspected));
      transaction.onerror = () => {
        reject(transaction.error ?? new Error("Unable to store the imported file."));
      };
      transaction.onabort = () => {
        reject(
          duplicate
            ? new Error("This file is already on your Local Shelf.")
            : (transaction.error ?? new Error("Unable to store the imported file.")),
        );
      };
    });
  } finally {
    database.close();
  }
}

export async function listLocalFiles(): Promise<LocalFileMetadata[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      request.onsuccess = () =>
        resolve((request.result as StoredLocalFile[]).map(metadataFromStored));
      request.onerror = () => reject(request.error ?? new Error("Unable to list local files."));
    });
  } finally {
    database.close();
  }
}

export async function getLocalFileBlob(fileId: string): Promise<Blob> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(fileId);
      request.onsuccess = () => {
        const file = request.result as StoredLocalFile | undefined;
        if (!file) {
          reject(new Error("Local file was not found."));
          return;
        }
        resolve(file.blob);
      };
      request.onerror = () => reject(request.error ?? new Error("Unable to read local file data."));
    });
  } finally {
    database.close();
  }
}

export async function setLocalFileWork(
  fileId: string,
  workId: string | null,
): Promise<LocalFileMetadata> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);
      let updated: StoredLocalFile | undefined;
      let abortError: Error | undefined;
      request.onsuccess = () => {
        const file = request.result as StoredLocalFile | undefined;
        if (!file) {
          abortError = new Error("Local file was not found.");
          transaction.abort();
          return;
        }
        if (file.workId !== null && file.workId !== workId) {
          abortError = new Error("Local file is already linked to a different work.");
          transaction.abort();
          return;
        }
        updated = { ...file, workId };
        store.put(updated);
      };
      request.onerror = () => transaction.abort();
      transaction.oncomplete = () => {
        if (updated) resolve(metadataFromStored(updated));
      };
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Unable to update the local file link."));
      transaction.onabort = () =>
        reject(
          abortError ?? transaction.error ?? new Error("Unable to update the local file link."),
        );
    });
  } finally {
    database.close();
  }
}
