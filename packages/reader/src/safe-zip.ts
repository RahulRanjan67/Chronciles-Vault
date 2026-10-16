export interface ZipEntry {
  readonly name: string;
  readonly crc32: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly compressionMethod: 0 | 8;
  readonly localHeaderOffset: number;
}

export interface ZipLimits {
  readonly maxDirectoryBytes?: number;
  readonly maxEntries?: number;
  readonly maxEntryBytes?: number;
  readonly maxCompressedEntryBytes?: number;
  readonly maxTotalBytes?: number;
  readonly maxCompressionRatio?: number;
}

export const CBZ_ZIP_LIMITS: Required<ZipLimits> = {
  maxDirectoryBytes: 64 * 1024,
  maxEntries: 2000,
  maxEntryBytes: 60 * 1024 * 1024,
  maxCompressedEntryBytes: 128 * 1024 * 1024,
  maxTotalBytes: 128 * 1024 * 1024,
  maxCompressionRatio: 100,
};

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const MAX_EOCD_SEARCH_BYTES = 65_557;

export class ZipSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipSecurityError";
  }
}

export function validateZipEntryPath(path: string): void {
  if (
    !path ||
    path.startsWith("/") ||
    path.startsWith("\\") ||
    /^[a-zA-Z]:/.test(path) ||
    /[\x00-\x1f\x7f]/.test(path)
  ) {
    throw new ZipSecurityError("The archive contains an unsafe entry path.");
  }
  const segments = path.split(/[\\/]/);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new ZipSecurityError("The archive contains a path traversal entry.");
  }
}

function readU16(view: DataView, offset: number): number {
  if (offset < 0 || offset + 2 > view.byteLength) {
    throw new ZipSecurityError("The ZIP archive is truncated.");
  }
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number): number {
  if (offset < 0 || offset + 4 > view.byteLength) {
    throw new ZipSecurityError("The ZIP archive is truncated.");
  }
  return view.getUint32(offset, true);
}

function findEocd(tail: DataView): number {
  for (let offset = tail.byteLength - 22; offset >= 0; offset -= 1) {
    if (readU32(tail, offset) !== EOCD_SIGNATURE) continue;
    const commentLength = readU16(tail, offset + 20);
    if (offset + 22 + commentLength === tail.byteLength) return offset;
  }
  throw new ZipSecurityError("The ZIP end-of-directory record is missing or malformed.");
}

function decodeEntryName(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ZipSecurityError("The ZIP archive contains an invalid entry name.");
  }
}

function updateCrc32(crc: number, bytes: Uint8Array): number {
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return crc;
}

async function inflateRaw(
  compressed: Uint8Array,
  expectedSize: number,
  expectedCrc: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser does not support safe ZIP decompression.");
  }
  let decompressor: DecompressionStream;
  try {
    decompressor = new DecompressionStream("deflate-raw" as CompressionFormat);
  } catch {
    throw new Error("This browser does not support raw DEFLATE ZIP entries.");
  }
  const compressedBuffer = compressed.slice().buffer as ArrayBuffer;
  const reader = new Blob([compressedBuffer]).stream().pipeThrough(decompressor).getReader();
  const output = new Uint8Array(expectedSize);
  let crc = 0xffffffff;
  let offset = 0;
  let size = 0;
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > expectedSize) {
        await reader.cancel();
        throw new ZipSecurityError("A ZIP entry expanded beyond its declared size.");
      }
      output.set(value, offset);
      offset += value.byteLength;
      crc = updateCrc32(crc, value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size !== expectedSize) {
    throw new ZipSecurityError("A ZIP entry did not match its declared size.");
  }
  if ((crc ^ 0xffffffff) >>> 0 !== expectedCrc) {
    throw new ZipSecurityError("A ZIP entry failed its integrity check.");
  }
  return output;
}

export class SafeZipArchive {
  private constructor(
    private readonly blob: Blob,
    readonly entries: readonly ZipEntry[],
    private readonly limits: Required<ZipLimits>,
    private readonly directoryOffset: number,
  ) {}

  static async open(blob: Blob, limits: ZipLimits = {}): Promise<SafeZipArchive> {
    const effectiveLimits = { ...CBZ_ZIP_LIMITS, ...limits };
    if (blob.size < 22) throw new ZipSecurityError("The ZIP archive is too small.");
    const tailStart = Math.max(0, blob.size - MAX_EOCD_SEARCH_BYTES);
    const tail = new DataView(await blob.slice(tailStart).arrayBuffer());
    const eocdOffset = findEocd(tail);
    const eocdAbsoluteOffset = tailStart + eocdOffset;
    const diskNumber = readU16(tail, eocdOffset + 4);
    const directoryDisk = readU16(tail, eocdOffset + 6);
    const diskEntryCount = readU16(tail, eocdOffset + 8);
    const entryCount = readU16(tail, eocdOffset + 10);
    const directorySize = readU32(tail, eocdOffset + 12);
    const directoryOffset = readU32(tail, eocdOffset + 16);

    if (
      diskNumber !== 0 ||
      directoryDisk !== 0 ||
      diskEntryCount !== entryCount ||
      entryCount === 0xffff ||
      directorySize === 0xffffffff ||
      directoryOffset === 0xffffffff
    ) {
      throw new ZipSecurityError("Multi-disk and ZIP64 archives are not supported.");
    }
    if (
      entryCount > effectiveLimits.maxEntries ||
      directorySize > effectiveLimits.maxDirectoryBytes ||
      directoryOffset + directorySize > eocdAbsoluteOffset
    ) {
      throw new ZipSecurityError("The ZIP directory exceeds the reader's safety limits.");
    }

    const directory = new DataView(
      await blob.slice(directoryOffset, directoryOffset + directorySize).arrayBuffer(),
    );
    const entries: ZipEntry[] = [];
    const names = new Set<string>();
    let offset = 0;
    let totalSize = 0;
    for (let index = 0; index < entryCount; index += 1) {
      if (readU32(directory, offset) !== CENTRAL_SIGNATURE) {
        throw new ZipSecurityError("The ZIP directory contains a malformed entry.");
      }
      const flags = readU16(directory, offset + 8);
      const compressionMethod = readU16(directory, offset + 10);
      const compressedSize = readU32(directory, offset + 20);
      const uncompressedSize = readU32(directory, offset + 24);
      const nameLength = readU16(directory, offset + 28);
      const extraLength = readU16(directory, offset + 30);
      const commentLength = readU16(directory, offset + 32);
      const diskStart = readU16(directory, offset + 34);
      const localHeaderOffset = readU32(directory, offset + 42);
      const entryEnd = offset + 46 + nameLength + extraLength + commentLength;
      if (entryEnd > directory.byteLength || diskStart !== 0) {
        throw new ZipSecurityError("The ZIP directory contains an invalid entry.");
      }
      if ((flags & 0x0001) !== 0 || (flags & 0x0040) !== 0) {
        throw new ZipSecurityError("Encrypted ZIP entries are not supported.");
      }
      if (compressionMethod !== 0 && compressionMethod !== 8) {
        throw new ZipSecurityError("The ZIP archive uses an unsupported compression method.");
      }
      if (
        compressedSize === 0xffffffff ||
        uncompressedSize === 0xffffffff ||
        localHeaderOffset === 0xffffffff
      ) {
        throw new ZipSecurityError("ZIP64 entries are not supported.");
      }

      const name = decodeEntryName(
        new Uint8Array(directory.buffer, directory.byteOffset + offset + 46, nameLength),
      );
      validateZipEntryPath(name);
      if (names.has(name)) throw new ZipSecurityError("The ZIP archive has duplicate entry names.");
      names.add(name);
      if (
        uncompressedSize > effectiveLimits.maxEntryBytes ||
        compressedSize > effectiveLimits.maxCompressedEntryBytes ||
        (compressedSize === 0
          ? uncompressedSize > 0
          : uncompressedSize / compressedSize > effectiveLimits.maxCompressionRatio)
      ) {
        throw new ZipSecurityError("A ZIP entry exceeds the size or compression-ratio limit.");
      }
      totalSize += uncompressedSize;
      if (totalSize > effectiveLimits.maxTotalBytes) {
        throw new ZipSecurityError("The ZIP archive exceeds the total expanded-size limit.");
      }
      if (name.endsWith("/")) {
        offset = entryEnd;
        continue;
      }
      entries.push({
        name,
        crc32: readU32(directory, offset + 16),
        compressedSize,
        uncompressedSize,
        compressionMethod,
        localHeaderOffset,
      });
      offset = entryEnd;
    }
    if (offset !== directory.byteLength) {
      throw new ZipSecurityError("The ZIP directory size does not match its entries.");
    }
    return new SafeZipArchive(blob, entries, effectiveLimits, directoryOffset);
  }

  async read(entry: ZipEntry | string, signal?: AbortSignal): Promise<Uint8Array> {
    const selected =
      typeof entry === "string"
        ? this.entries.find((item) => item.name === entry)
        : this.entries.find(
            (item) =>
              item.name === entry.name &&
              item.crc32 === entry.crc32 &&
              item.localHeaderOffset === entry.localHeaderOffset,
          );
    if (!selected) throw new Error("Archive entry was not found.");
    validateZipEntryPath(selected.name);

    const headerBytes = new DataView(
      await this.blob
        .slice(selected.localHeaderOffset, selected.localHeaderOffset + 30)
        .arrayBuffer(),
    );
    if (readU32(headerBytes, 0) !== LOCAL_SIGNATURE) {
      throw new ZipSecurityError("The ZIP entry has an invalid local header.");
    }
    const localFlags = readU16(headerBytes, 6);
    const localMethod = readU16(headerBytes, 8);
    const nameLength = readU16(headerBytes, 26);
    const extraLength = readU16(headerBytes, 28);
    if (
      (localFlags & 0x0001) !== 0 ||
      localMethod !== selected.compressionMethod ||
      selected.localHeaderOffset + 30 + nameLength + extraLength + selected.compressedSize >
        this.directoryOffset
    ) {
      throw new ZipSecurityError("The ZIP entry's local header is inconsistent.");
    }
    const localName = decodeEntryName(
      new Uint8Array(
        await this.blob
          .slice(selected.localHeaderOffset + 30, selected.localHeaderOffset + 30 + nameLength)
          .arrayBuffer(),
      ),
    );
    if (localName !== selected.name) {
      throw new ZipSecurityError("The ZIP entry name does not match its directory record.");
    }
    const dataStart = selected.localHeaderOffset + 30 + nameLength + extraLength;
    const compressed = new Uint8Array(
      await this.blob.slice(dataStart, dataStart + selected.compressedSize).arrayBuffer(),
    );
    if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
    const output =
      selected.compressionMethod === 0
        ? compressed
        : await inflateRaw(compressed, selected.uncompressedSize, selected.crc32, signal);
    if (output.byteLength !== selected.uncompressedSize) {
      throw new ZipSecurityError("A ZIP entry did not match its declared size.");
    }

    if (
      selected.compressionMethod === 0 &&
      (updateCrc32(0xffffffff, output) ^ 0xffffffff) >>> 0 !== selected.crc32
    ) {
      throw new ZipSecurityError("A ZIP entry failed its integrity check.");
    }
    return output;
  }
}
