import { inspectCbzImage } from "./cbz.js";

export interface StoredMemoryImage {
  readonly fileId: string;
  readonly thumbnailId: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width: number;
  readonly height: number;
  readonly createdAt: string;
}

const DATABASE_NAME = "chronicles-vault-reader";
const DATABASE_VERSION = 4;
const FILE_STORE_NAME = "local-files";
const SESSION_STORE_NAME = "reading-sessions";
const BOOKMARK_STORE_NAME = "pdf-bookmarks";
const ASSET_STORE_NAME = "memory-assets";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 16_000;
const MAX_DECODED_BYTES = 60 * 1024 * 1024;
const THUMBNAIL_EDGE = 320;

export function inspectMemoryImageSignature(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    new TextDecoder().decode(bytes.subarray(8, 12)).startsWith("avif")
  ) {
    return "image/avif";
  }
  return null;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Memory image storage is unavailable in this browser."));
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
      if (!database.objectStoreNames.contains(ASSET_STORE_NAME)) {
        database.createObjectStore(ASSET_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open memory image storage."));
    request.onblocked = () => reject(new Error("Memory image storage upgrade is blocked."));
  });
}

function saveBlobs(blobs: readonly { id: string; blob: Blob }[]): Promise<void> {
  return openDatabase().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(ASSET_STORE_NAME, "readwrite");
        const store = transaction.objectStore(ASSET_STORE_NAME);
        for (const record of blobs) store.put(record);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = transaction.onabort = () => {
          database.close();
          reject(transaction.error ?? new Error("Unable to save the memory image."));
        };
      }),
  );
}

export async function storeMemoryAssetBlob(id: string, blob: Blob): Promise<void> {
  if (!id.trim()) throw new Error("Memory asset IDs must not be empty.");
  await saveBlobs([{ id, blob }]);
}

export async function getMemoryAssetBlob(id: string): Promise<Blob> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(ASSET_STORE_NAME, "readonly")
        .objectStore(ASSET_STORE_NAME)
        .get(id);
      request.onsuccess = () => {
        const blob = (request.result as { blob?: Blob } | undefined)?.blob;
        if (blob) resolve(blob);
        else reject(new Error("The memory image is no longer available on this device."));
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Unable to read the memory image."));
    });
  } finally {
    database.close();
  }
}

export async function storeMemoryImage(
  file: File,
  cryptoProvider: Pick<Crypto, "randomUUID"> = globalThis.crypto,
  now = new Date(),
): Promise<StoredMemoryImage> {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error("Memory images must be between 1 byte and 10 MB.");
  }
  const mimeType = inspectMemoryImageSignature(
    new Uint8Array(await file.slice(0, 16).arrayBuffer()),
  );
  if (!mimeType) throw new Error("Choose a JPEG, PNG, WebP, or AVIF image.");
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
  const header = new Uint8Array(await file.slice(0, 1024 * 1024).arrayBuffer());
  const inspected = inspectCbzImage(header, extension);
  if (inspected.mimeType !== mimeType) {
    throw new Error("The selected image signature does not match its content.");
  }
  if (
    inspected.dimensions.width > MAX_IMAGE_DIMENSION ||
    inspected.dimensions.height > MAX_IMAGE_DIMENSION ||
    inspected.dimensions.width * inspected.dimensions.height * 4 > MAX_DECODED_BYTES
  ) {
    throw new Error("Memory image exceeds safe dimension or decoded-size limits.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("This browser cannot safely inspect local image dimensions.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const width = bitmap.width;
    const height = bitmap.height;
    if (
      width < 1 ||
      height < 1 ||
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION ||
      width * height * 4 > MAX_DECODED_BYTES ||
      width !== inspected.dimensions.width ||
      height !== inspected.dimensions.height
    ) {
      throw new Error("Memory image exceeds safe dimension or decoded-size limits.");
    }
    const scale = Math.min(1, THUMBNAIL_EDGE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create a local memory-image thumbnail.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Unable to create a thumbnail."))),
        "image/webp",
        0.78,
      );
    });
    const fileId = cryptoProvider.randomUUID();
    const thumbnailId = cryptoProvider.randomUUID();
    await saveBlobs([
      { id: fileId, blob: file },
      { id: thumbnailId, blob: thumbnail },
    ]);
    return {
      fileId,
      thumbnailId,
      mimeType,
      sizeBytes: file.size,
      width,
      height,
      createdAt: now.toISOString(),
    };
  } finally {
    bitmap.close();
  }
}
