import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getLocalFileBlob,
  importLocalFile,
  listLocalFiles,
  setLocalFileWork,
} from "../src/local-files";
import {
  endReaderSession,
  listReaderSessions,
  startReaderSession,
  updateReaderSession,
} from "../src/reader-sessions";
import { listPdfBookmarks, togglePdfBookmark } from "../src/pdf-bookmarks";
import { getMemoryAssetBlob, storeMemoryAssetBlob } from "../src/memory-assets";

const DATABASE_NAME = "grimoire-reader";

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database deletion was blocked."));
  });
}

describe("local file storage", () => {
  beforeEach(deleteDatabase);
  afterEach(deleteDatabase);

  it("persists file data locally, deduplicates by hash, and links it once", async () => {
    const source = new File(["%PDF-1.7 local book"], "book.pdf");
    const stored = await importLocalFile(source);

    expect(stored.blob).toBeUndefined();
    expect(await listLocalFiles()).toEqual([stored]);
    expect(await (await getLocalFileBlob(stored.id)).text()).toBe("%PDF-1.7 local book");
    await expect(getLocalFileBlob("missing")).rejects.toThrow("Local file was not found");
    await expect(importLocalFile(new File(["%PDF-1.7 local book"], "renamed.pdf"))).rejects.toThrow(
      "already on your Local Shelf",
    );

    await setLocalFileWork(stored.id, "work-1");
    expect((await listLocalFiles())[0]?.workId).toBe("work-1");
    await expect(setLocalFileWork(stored.id, "work-2")).rejects.toThrow(
      "already linked to a different work",
    );
    expect((await listLocalFiles())[0]?.workId).toBe("work-1");
  });

  it("tracks reading sessions with exact timestamps, elapsed time, and anchors", async () => {
    const file = await importLocalFile(new File(["%PDF-1.7 local book"], "book.pdf"));
    await setLocalFileWork(file.id, "work-session");
    const startedAt = new Date("2026-10-05T00:00:00.000Z");
    const startAnchor = { type: "page" as const, page: 2, totalPages: 8 };
    const session = await startReaderSession(
      file.id,
      "work-session",
      startAnchor,
      startedAt,
      "session-1",
    );
    expect(session.anchorBefore).toEqual(startAnchor);
    await expect(
      startReaderSession(file.id, "another-work", startAnchor, startedAt, "invalid-session"),
    ).rejects.toThrow("does not match");

    const lastAnchor = { type: "page" as const, page: 5, totalPages: 8 };
    const checkpoint = await updateReaderSession(
      session.id,
      lastAnchor,
      new Date("2026-10-05T00:00:25.000Z"),
    );
    expect(checkpoint.durationSeconds).toBe(25);
    expect(checkpoint.endedAt).toBeNull();

    const ended = await endReaderSession(
      session.id,
      lastAnchor,
      new Date("2026-10-05T00:01:12.000Z"),
    );
    expect(ended.durationSeconds).toBe(72);
    expect(ended.endedAt).toBe("2026-10-05T00:01:12.000Z");
    expect(ended.anchorAfter).toEqual(lastAnchor);
    expect(await listReaderSessions("work-session")).toEqual([ended]);
    await expect(endReaderSession(session.id, lastAnchor)).rejects.toThrow("already ended");
  });

  it("stores and toggles PDF bookmarks per local file", async () => {
    const file = await importLocalFile(new File(["%PDF-1.7 local book"], "book.pdf"));
    const createdAt = new Date("2026-10-05T00:00:00.000Z");
    const bookmark = await togglePdfBookmark(file.id, 3, 8, createdAt);
    expect(bookmark).toEqual({
      id: `${file.id}:3`,
      fileId: file.id,
      pageNumber: 3,
      title: "Page 3",
      createdAt: createdAt.toISOString(),
    });
    expect(await listPdfBookmarks(file.id)).toEqual([bookmark]);
    expect(await togglePdfBookmark(file.id, 3, 8)).toBeNull();
    expect(await listPdfBookmarks(file.id)).toEqual([]);
    await expect(togglePdfBookmark("missing", 1, 1)).rejects.toThrow("missing local PDF");
  });

  it("upgrades an existing reader database with PDF bookmarks and memory assets", async () => {
    const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 2);
      request.onupgradeneeded = () => {
        const database = request.result;
        const files = database.createObjectStore("local-files", { keyPath: "id" });
        files.createIndex("contentHash", "contentHash", { unique: true });
        const sessions = database.createObjectStore("reading-sessions", { keyPath: "id" });
        sessions.createIndex("workId", "workId", { unique: false });
        sessions.createIndex("fileId", "fileId", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    legacy.close();

    expect(await listPdfBookmarks("any-file")).toEqual([]);
    const upgraded = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 4);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(upgraded.objectStoreNames.contains("pdf-bookmarks")).toBe(true);
    expect(upgraded.objectStoreNames.contains("memory-assets")).toBe(true);
    upgraded.close();
  });

  it("stores and reads image blobs in local memory-asset storage", async () => {
    const blob = new Blob(["small image placeholder"], { type: "image/png" });
    await storeMemoryAssetBlob("image-1", blob);
    expect(await (await getMemoryAssetBlob("image-1")).text()).toBe("small image placeholder");
    await expect(getMemoryAssetBlob("missing")).rejects.toThrow("no longer available");
    await expect(storeMemoryAssetBlob("", blob)).rejects.toThrow("must not be empty");
  });
});
