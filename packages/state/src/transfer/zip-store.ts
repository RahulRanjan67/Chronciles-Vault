/**
 * Minimal ZIP writer and reader using the "stored" method (no compression).
 * Dependency-free so the export bundle works in the browser without a
 * compression library. Every entry carries a CRC-32 that the reader verifies.
 */

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const MAX_ENTRIES = 0xffff;
const MAX_ENTRY_NAME_LENGTH = 255;
const UTF8_FLAG = 0x0800;

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (CRC_TABLE[(crc ^ data[i]!) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntryInput {
  readonly name: string;
  readonly data: Uint8Array;
}

export interface ZipEntryOutput {
  readonly name: string;
  readonly data: Uint8Array;
}

/** Rejects absolute paths, traversal segments, backslashes, and control characters. */
export function validateZipEntryName(name: string): string | null {
  if (!name || name.length > MAX_ENTRY_NAME_LENGTH) return "Entry name is empty or too long.";
  if (name.startsWith("/") || /^[a-zA-Z]:/.test(name)) return "Absolute paths are not allowed.";
  if (name.includes("\\")) return "Backslashes are not allowed in entry names.";
  if (name.split("/").some((part) => part === "..")) return "Path traversal is not allowed.";
  if (/[\u0000-\u001f]/.test(name)) return "Control characters are not allowed.";
  return null;
}

export function createStoredZip(entries: readonly ZipEntryInput[]): Uint8Array {
  if (entries.length === 0) throw new Error("A ZIP archive needs at least one entry.");
  if (entries.length > MAX_ENTRIES) throw new Error("Too many entries for a single ZIP archive.");

  const encoder = new TextEncoder();
  const seen = new Set<string>();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const problem = validateZipEntryName(entry.name);
    if (problem) throw new Error(`${entry.name}: ${problem}`);
    if (seen.has(entry.name)) throw new Error(`Duplicate entry name: ${entry.name}`);
    seen.add(entry.name);

    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + nameBytes.length + size);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, LOCAL_FILE_HEADER, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, UTF8_FLAG, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x21, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(entry.data, 30 + nameBytes.length);
    locals.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, CENTRAL_DIRECTORY_HEADER, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, UTF8_FLAG, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centrals.push(central);

    offset += local.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  if (offset > 0xffffffff || centralSize > 0xffffffff) {
    throw new Error("Archive is too large for the ZIP stored format.");
  }

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, END_OF_CENTRAL_DIRECTORY, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const out = new Uint8Array(offset + centralSize + end.length);
  let cursor = 0;
  for (const part of locals) {
    out.set(part, cursor);
    cursor += part.length;
  }
  for (const part of centrals) {
    out.set(part, cursor);
    cursor += part.length;
  }
  out.set(end, cursor);
  return out;
}

/**
 * Reads a stored ZIP written by createStoredZip. Verifies CRC-32 per entry and
 * rejects compressed entries or unsafe names.
 */
export function readStoredZip(bytes: Uint8Array): ZipEntryOutput[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder("utf-8", { fatal: true });

  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i >= bytes.length - 22 - 0xffff; i--) {
    if (view.getUint32(i, true) === END_OF_CENTRAL_DIRECTORY) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP archive.");

  const count = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const results: ZipEntryOutput[] = [];

  for (let n = 0; n < count; n++) {
    if (view.getUint32(cursor, true) !== CENTRAL_DIRECTORY_HEADER) throw new Error("Corrupt central directory.");
    const method = view.getUint16(cursor + 10, true);
    const crc = view.getUint32(cursor + 16, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;

    if (method !== 0) throw new Error(`${name}: compressed entries are not supported.`);
    const problem = validateZipEntryName(name);
    if (problem) throw new Error(`${name}: ${problem}`);

    if (view.getUint32(localOffset, true) !== LOCAL_FILE_HEADER) throw new Error(`${name}: corrupt local header.`);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.slice(dataStart, dataStart + size);
    if (data.length !== size) throw new Error(`${name}: truncated entry.`);
    if (crc32(data) !== crc) throw new Error(`${name}: CRC-32 mismatch.`);
    results.push({ name, data });
  }
  return results;
}
