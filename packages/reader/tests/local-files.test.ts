import { describe, expect, it } from "vitest";
import { inspectLocalFile } from "../src/local-files";

const epubBytes = new Uint8Array([
  0x50,
  0x4b,
  0x03,
  0x04,
  0x14,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x14,
  0x00,
  0x00,
  0x00,
  0x14,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x08,
  0x00,
  0x00,
  0x00,
  ...new TextEncoder().encode("mimetype"),
  ...new TextEncoder().encode("application/epub+zip"),
]);

describe("local file inspection", () => {
  it("recognizes EPUB/PDF/CBZ by extension and file signature and hashes content", async () => {
    const now = new Date("2026-10-04T00:00:00.000Z");
    const epub = await inspectLocalFile(
      new File([epubBytes], "story.epub", { lastModified: now.getTime() }),
      crypto,
      now,
    );
    const pdf = await inspectLocalFile(new File(["%PDF-1.7 document"], "paper.pdf"), crypto, now);
    const cbz = await inspectLocalFile(
      new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04])], "comic.cbz"),
      crypto,
      now,
    );

    expect(epub.mimeType).toBe("application/epub+zip");
    expect(pdf.mimeType).toBe("application/pdf");
    expect(cbz.mimeType).toBe("application/vnd.comicbook+zip");
    expect(pdf.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(pdf.sizeBytes).toBe(17);
    expect(pdf.workId).toBeNull();
    expect(epub.importedAt).toBe(now.toISOString());
  });

  it("rejects a mismatched extension and file signature", async () => {
    await expect(inspectLocalFile(new File(["not a PDF"], "fake.pdf"))).rejects.toThrow(
      "valid PDF signature",
    );
    await expect(inspectLocalFile(new File(["not an EPUB"], "fake.epub"))).rejects.toThrow(
      "valid EPUB package",
    );
  });

  it("rejects unsupported, empty, and over-limit files", async () => {
    await expect(inspectLocalFile(new File(["content"], "archive.cbr"))).rejects.toThrow(
      "Choose an EPUB, PDF, or CBZ",
    );
    await expect(inspectLocalFile(new File([], "empty.pdf"))).rejects.toThrow("empty");
    const oversized = {
      name: "large.pdf",
      size: 128 * 1024 * 1024 + 1,
      lastModified: 0,
      slice: () => new Blob(["%PDF-"]),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as File;
    await expect(inspectLocalFile(oversized)).rejects.toThrow("128 MB or smaller");
  });
});
