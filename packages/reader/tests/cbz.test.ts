import { describe, expect, it } from "vitest";
import {
  getCbzCacheWindow,
  openCbz,
  inspectCbzImage,
  toCbzPageAnchor,
  toCbzPageNumber,
} from "../src/cbz";
import { ZipSecurityError } from "../src/safe-zip";
import { createStoredZip } from "./zip-fixture";

function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function jpeg(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0,
    8,
    8,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    3,
  ]);
}

function webp(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  bytes.set([0x56, 0x50, 0x38, 0x58], 12);
  bytes[24] = (width - 1) & 0xff;
  bytes[25] = ((width - 1) >> 8) & 0xff;
  bytes[26] = ((width - 1) >> 16) & 0xff;
  bytes[27] = (height - 1) & 0xff;
  bytes[28] = ((height - 1) >> 8) & 0xff;
  bytes[29] = ((height - 1) >> 16) & 0xff;
  return bytes;
}

function avif(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(36);
  bytes.set([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70], 0);
  bytes.set([0x61, 0x76, 0x69, 0x66], 8);
  bytes.set([0x6d, 0x69, 0x66, 0x31], 16);
  bytes.set([0, 0, 0, 20, 0x69, 0x73, 0x70, 0x65], 16);
  const view = new DataView(bytes.buffer);
  view.setUint32(28, width);
  view.setUint32(32, height);
  return bytes;
}

describe("CBZ archive reader", () => {
  it("orders page names naturally and extracts one verified image at a time", async () => {
    const archive = await openCbz(
      createStoredZip([
        { name: "10.png", data: png(400, 600) },
        { name: "2.png", data: png(500, 700) },
        { name: "cover.txt", data: new TextEncoder().encode("ignored") },
      ]),
    );

    expect(archive.pages.map(({ name }) => name)).toEqual(["2.png", "10.png"]);
    const page = await archive.loadPage(0);
    expect(page?.blob.type).toBe("image/png");
    expect(page?.blob.size).toBe(24);
    expect(page?.dimensions).toEqual({ width: 500, height: 700 });
    await expect(archive.loadPage(2)).rejects.toThrow("does not exist");
  });

  it("silently skips fake images and rejects oversized decoded dimensions", async () => {
    const archive = await openCbz(
      createStoredZip([
        { name: "01.jpg", data: new TextEncoder().encode("not a jpeg") },
        { name: "02.png", data: png(16_000, 16_000) },
      ]),
    );
    await expect(archive.loadPage(0)).resolves.toBeNull();
    await expect(archive.loadPage(1)).resolves.toBeNull();
    expect(() => inspectCbzImage(png(16_000, 16_000), "png")).toThrow(ZipSecurityError);
  });

  it("resumes using 1-indexed page anchors and clamps invalid positions", () => {
    expect(toCbzPageNumber({ type: "page", page: 8, totalPages: 10 }, 4)).toBe(4);
    expect(toCbzPageNumber({ type: "page", page: -2, totalPages: 10 }, 4)).toBe(1);
    expect(toCbzPageNumber(null, 4)).toBe(1);
    expect(toCbzPageAnchor(3, 7)).toEqual({ type: "page", page: 3, totalPages: 7 });
  });

  it("scans only the active page and its two neighbors", () => {
    expect(getCbzCacheWindow(0, 10)).toEqual([0, 1, 2]);
    expect(getCbzCacheWindow(5, 10)).toEqual([3, 4, 5, 6, 7]);
    expect(getCbzCacheWindow(9, 10)).toEqual([7, 8, 9]);
    expect(getCbzCacheWindow(0, 0)).toEqual([]);
  });

  it.each([
    ["jpg", jpeg(1200, 1800), "image/jpeg", { width: 1200, height: 1800 }],
    ["png", png(800, 1200), "image/png", { width: 800, height: 1200 }],
    ["webp", webp(640, 960), "image/webp", { width: 640, height: 960 }],
    ["avif", avif(1024, 1536), "image/avif", { width: 1024, height: 1536 }],
  ])("verifies %s magic bytes and bounded dimensions", (extension, bytes, mimeType, size) => {
    expect(inspectCbzImage(bytes as Uint8Array, extension)).toEqual({
      mimeType,
      dimensions: size,
    });
  });

  it("rejects non-image archives", async () => {
    await expect(
      openCbz(createStoredZip([{ name: "readme.txt", data: new Uint8Array([1]) }])),
    ).rejects.toThrow("no supported image pages");
  });
});
