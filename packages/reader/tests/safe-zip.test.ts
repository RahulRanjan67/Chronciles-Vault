import { describe, expect, it } from "vitest";
import {
  CBZ_ZIP_LIMITS,
  SafeZipArchive,
  validateZipEntryPath,
  ZipSecurityError,
} from "../src/safe-zip";
import { createStoredZip } from "./zip-fixture";

describe("bounded ZIP reading", () => {
  it("reads an entry on demand and verifies its CRC and local name", async () => {
    const archive = await SafeZipArchive.open(
      createStoredZip([{ name: "Text/chapter.xhtml", data: new TextEncoder().encode("chapter") }]),
    );

    await expect(archive.read("Text/chapter.xhtml")).resolves.toEqual(
      new TextEncoder().encode("chapter"),
    );
  });

  it("decompresses bounded raw-DEFLATE entries and verifies the expanded CRC", async () => {
    const source = new TextEncoder().encode("safe deflate entry ".repeat(4));
    const archive = await SafeZipArchive.open(
      createStoredZip([{ name: "Text/chapter.xhtml", data: source, compressionMethod: 8 }]),
    );
    await expect(archive.read("Text/chapter.xhtml")).resolves.toEqual(source);
  });

  it.each([
    "../outside.jpg",
    "folder/./page.jpg",
    "folder/../../outside.jpg",
    "/root.jpg",
    "\\root.jpg",
    "C:\\evil.jpg",
    "a\u0000.jpg",
  ])("rejects unsafe entry path %s before reading data", (path) => {
    expect(() => validateZipEntryPath(path)).toThrow(ZipSecurityError);
  });

  it("enforces the contract's directory, expansion, entry, and count bounds", () => {
    expect(CBZ_ZIP_LIMITS).toEqual({
      maxDirectoryBytes: 64 * 1024,
      maxEntries: 2000,
      maxEntryBytes: 60 * 1024 * 1024,
      maxCompressedEntryBytes: 128 * 1024 * 1024,
      maxTotalBytes: 128 * 1024 * 1024,
      maxCompressionRatio: 100,
    });
  });

  it("rejects oversized directories, excessive entry counts, and expansion ratios", async () => {
    const archive = createStoredZip([
      { name: "page.jpg", data: new Uint8Array([1]), declaredSize: 101 },
    ]);
    await expect(SafeZipArchive.open(archive, { maxCompressionRatio: 100 })).rejects.toThrow(
      "compression-ratio",
    );
    await expect(
      SafeZipArchive.open(createStoredZip([{ name: "one", data: new Uint8Array([1]) }]), {
        maxEntries: 0,
      }),
    ).rejects.toThrow("safety limits");
    await expect(
      SafeZipArchive.open(createStoredZip([{ name: "one", data: new Uint8Array([1]) }]), {
        maxDirectoryBytes: 1,
      }),
    ).rejects.toThrow("safety limits");
  });

  it("rejects duplicate paths and corrupted entry bytes", async () => {
    await expect(
      SafeZipArchive.open(
        createStoredZip([
          { name: "page.png", data: new Uint8Array([1]) },
          { name: "page.png", data: new Uint8Array([2]) },
        ]),
      ),
    ).rejects.toThrow("duplicate");

    const bytes = await createStoredZip([
      { name: "page.png", data: new Uint8Array([1, 2, 3]) },
    ]).arrayBuffer();
    new Uint8Array(bytes)[38] = 9;
    const archive = await SafeZipArchive.open(new Blob([bytes]));
    await expect(archive.read("page.png")).rejects.toThrow("integrity");
  });
});
