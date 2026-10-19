import { CBZ_ZIP_LIMITS, SafeZipArchive, ZipSecurityError } from "./safe-zip.js";
import type { ZipEntry, ZipLimits } from "./safe-zip.js";
import type { PageAnchor, ProgressAnchor } from "@grimoire/domain";

export interface CbzImageDimensions {
  readonly width: number;
  readonly height: number;
}

export interface CbzPage {
  readonly index: number;
  readonly name: string;
  readonly sizeBytes: number;
}

export interface CbzLoadedPage {
  readonly blob: Blob;
  readonly dimensions: CbzImageDimensions;
}

export interface CbzArchive {
  readonly pages: readonly CbzPage[];
  loadPage(index: number, signal?: AbortSignal): Promise<CbzLoadedPage | null>;
}

const MAX_IMAGE_PIXELS = Math.floor((60 * 1024 * 1024) / 4);
const MAX_DIMENSION_SCAN_BYTES = 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

function u24le(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
}

function dimensions(width: number, height: number): CbzImageDimensions {
  if (
    width < 1 ||
    height < 1 ||
    width > 16_000 ||
    height > 16_000 ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new ZipSecurityError("A comic page exceeds the safe image dimension limit.");
  }
  return { width, height };
}

function jpegDimensions(bytes: Uint8Array): CbzImageDimensions {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new ZipSecurityError("A CBZ image does not have a valid JPEG signature.");
  }
  const frameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;
  const scanEnd = Math.min(bytes.byteLength, MAX_DIMENSION_SCAN_BYTES);
  while (offset + 4 <= scanEnd) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1] ?? 0;
    offset += 2;
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }
    const segmentLength = ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
    if (segmentLength < 2 || offset + segmentLength > scanEnd) break;
    if (frameMarkers.has(marker)) {
      if (segmentLength < 8) {
        throw new ZipSecurityError("A CBZ JPEG dimension header is malformed.");
      }
      return dimensions(
        ((bytes[offset + 5] ?? 0) << 8) | (bytes[offset + 6] ?? 0),
        ((bytes[offset + 3] ?? 0) << 8) | (bytes[offset + 4] ?? 0),
      );
    }
    offset += segmentLength;
  }
  throw new ZipSecurityError("A CBZ JPEG page has no bounded, valid dimension header.");
}

function pngDimensions(bytes: Uint8Array): CbzImageDimensions {
  if (bytes.byteLength < 24) throw new ZipSecurityError("A CBZ PNG image is truncated.");
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    signature.some((byte, index) => bytes[index] !== byte) ||
    bytes[12] !== 0x49 ||
    bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 ||
    bytes[15] !== 0x52
  ) {
    throw new ZipSecurityError("A CBZ image does not have a valid PNG signature.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dimensions(view.getUint32(16), view.getUint32(20));
}

function webpDimensions(bytes: Uint8Array): CbzImageDimensions {
  if (
    bytes[0] !== 0x52 ||
    bytes[1] !== 0x49 ||
    bytes[2] !== 0x46 ||
    bytes[3] !== 0x46 ||
    bytes[8] !== 0x57 ||
    bytes[9] !== 0x45 ||
    bytes[10] !== 0x42 ||
    bytes[11] !== 0x50
  ) {
    throw new ZipSecurityError("A CBZ image does not have a valid WebP signature.");
  }
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
    if (bytes.byteLength < 30) throw new ZipSecurityError("A CBZ WebP image is truncated.");
    return dimensions(u24le(bytes, 24) + 1, u24le(bytes, 27) + 1);
  }
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4c) {
    if (bytes.byteLength < 25) throw new ZipSecurityError("A CBZ WebP image is truncated.");
    if (bytes[20] !== 0x2f) throw new ZipSecurityError("A CBZ WebP image is malformed.");
    const width = 1 + ((bytes[21] ?? 0) | (((bytes[22] ?? 0) & 0x3f) << 8));
    const height =
      1 + (((bytes[22] ?? 0) >> 6) | ((bytes[23] ?? 0) << 2) | (((bytes[24] ?? 0) & 0x0f) << 10));
    return dimensions(width, height);
  }
  if (
    bytes[12] === 0x56 &&
    bytes[13] === 0x50 &&
    bytes[14] === 0x38 &&
    bytes[15] === 0x20 &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    if (bytes.byteLength < 30) throw new ZipSecurityError("A CBZ WebP image is truncated.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return dimensions(view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff);
  }
  throw new ZipSecurityError("A CBZ WebP page has an unsupported bitstream.");
}

function avifDimensions(bytes: Uint8Array): CbzImageDimensions {
  if (
    bytes.length < 12 ||
    bytes[4] !== 0x66 ||
    bytes[5] !== 0x74 ||
    bytes[6] !== 0x79 ||
    bytes[7] !== 0x70 ||
    !new TextDecoder().decode(bytes.subarray(8, 12)).startsWith("avif")
  ) {
    throw new ZipSecurityError("A CBZ image does not have a valid AVIF signature.");
  }
  const scanEnd = Math.min(bytes.byteLength, MAX_DIMENSION_SCAN_BYTES);
  for (let offset = 4; offset + 16 <= scanEnd; offset += 1) {
    if (
      bytes[offset] === 0x69 &&
      bytes[offset + 1] === 0x73 &&
      bytes[offset + 2] === 0x70 &&
      bytes[offset + 3] === 0x65
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return dimensions(view.getUint32(offset + 8), view.getUint32(offset + 12));
    }
  }
  throw new ZipSecurityError("A CBZ AVIF page has no bounded, valid dimension header.");
}

export function inspectCbzImage(
  bytes: Uint8Array,
  extension: string,
): { readonly mimeType: string; readonly dimensions: CbzImageDimensions } {
  const normalized = extension.toLowerCase().replace(/^\./, "");
  if (normalized === "jpg" || normalized === "jpeg") {
    return { mimeType: "image/jpeg", dimensions: jpegDimensions(bytes) };
  }
  if (normalized === "png") return { mimeType: "image/png", dimensions: pngDimensions(bytes) };
  if (normalized === "webp") return { mimeType: "image/webp", dimensions: webpDimensions(bytes) };
  if (normalized === "avif") return { mimeType: "image/avif", dimensions: avifDimensions(bytes) };
  throw new ZipSecurityError("The archive contains an unsupported comic image type.");
}

function naturalCompare(left: string, right: string): number {
  return left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

export async function openCbz(blob: Blob, limits: ZipLimits = CBZ_ZIP_LIMITS): Promise<CbzArchive> {
  const archive = await SafeZipArchive.open(blob, limits);
  const images = archive.entries
    .filter((entry) => {
      const extension = entry.name.split(".").pop()?.toLowerCase() ?? "";
      return IMAGE_EXTENSIONS.has(extension);
    })
    .sort((left, right) => naturalCompare(left.name, right.name));
  if (images.length === 0) throw new Error("This CBZ archive contains no supported image pages.");
  return {
    pages: images.map((entry, index) => ({
      index,
      name: entry.name,
      sizeBytes: entry.uncompressedSize,
    })),
    async loadPage(index: number, signal?: AbortSignal) {
      const page = images[index];
      if (!page) throw new RangeError("The selected comic page does not exist.");
      const bytes = await archive.read(page, signal);
      const extension = page.name.split(".").pop() ?? "";
      let image: ReturnType<typeof inspectCbzImage>;
      try {
        image = inspectCbzImage(bytes, extension);
      } catch (error) {
        if (error instanceof ZipSecurityError) return null;
        throw error;
      }

      return {
        blob: new Blob([bytes.buffer as ArrayBuffer], { type: image.mimeType }),
        dimensions: image.dimensions,
      };
    },
  };
}

export function getCbzCacheWindow(activePageIndex: number, totalPages: number): readonly number[] {
  if (!Number.isInteger(totalPages) || totalPages < 1) return [];
  const active = Math.min(Math.max(Math.trunc(activePageIndex), 0), totalPages - 1);
  const first = Math.max(0, active - 2);
  const last = Math.min(totalPages - 1, active + 2);
  const indexes: number[] = [];
  for (let index = first; index <= last; index += 1) indexes.push(index);
  return indexes;
}

export function toCbzPageNumber(anchor: ProgressAnchor | null, totalPages: number): number {
  if (anchor?.type !== "page" || !Number.isFinite(anchor.page)) return 1;
  return Math.min(Math.max(Math.trunc(anchor.page), 1), Math.max(totalPages, 1));
}

export function toCbzPageAnchor(pageNumber: number, totalPages: number): PageAnchor {
  const total = Math.max(1, Math.trunc(totalPages));
  return {
    type: "page",
    page: Math.min(Math.max(Math.trunc(pageNumber), 1), total),
    totalPages: total,
  };
}

export type { ZipEntry };
