import { describe, expect, it } from "vitest";
import { inspectMemoryImageSignature } from "../src/memory-assets";

describe("memory image validation", () => {
  it("recognizes supported image signatures instead of trusting file extensions", () => {
    expect(
      inspectMemoryImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00])),
    ).toBe("image/jpeg");
    expect(
      inspectMemoryImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("image/png");
    expect(
      inspectMemoryImageSignature(
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
      ),
    ).toBe("image/webp");
    expect(
      inspectMemoryImageSignature(
        new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]),
      ),
    ).toBe("image/avif");
    expect(inspectMemoryImageSignature(new Uint8Array([0x4d, 0x5a, 0x00]))).toBeNull();
  });
});
