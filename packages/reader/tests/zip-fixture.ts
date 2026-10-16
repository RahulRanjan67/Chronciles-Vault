import { deflateRawSync } from "node:zlib";

export interface ZipFixtureEntry {
  readonly name: string;
  readonly data: Uint8Array;
  readonly declaredSize?: number;
  readonly compressionMethod?: 0 | 8;
}

function put16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function put32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

export function fixtureCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createStoredZip(entries: readonly ZipFixtureEntry[]): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  let centralSize = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = fixtureCrc32(entry.data);
    const method = entry.compressionMethod ?? 0;
    const compressed = method === 8 ? new Uint8Array(deflateRawSync(entry.data)) : entry.data;
    const local = new Uint8Array(30 + nameBytes.length + compressed.length);
    const localView = new DataView(local.buffer);
    put32(localView, 0, 0x04034b50);
    put16(localView, 4, 20);
    put16(localView, 6, 0x0800);
    put16(localView, 8, method);
    put32(localView, 14, crc);
    put32(localView, 18, compressed.length);
    put32(localView, 22, entry.data.length);
    put16(localView, 26, nameBytes.length);
    local.set(nameBytes, 30);
    local.set(compressed, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    put32(centralView, 0, 0x02014b50);
    put16(centralView, 4, 20);
    put16(centralView, 6, 20);
    put16(centralView, 8, 0x0800);
    put16(centralView, 10, method);
    put32(centralView, 16, crc);
    put32(centralView, 20, compressed.length);
    put32(centralView, 24, entry.declaredSize ?? entry.data.length);
    put16(centralView, 28, nameBytes.length);
    put32(centralView, 42, localOffset);
    central.set(nameBytes, 46);
    centralParts.push(central);

    localOffset += local.length;
    centralSize += central.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  put32(eocdView, 0, 0x06054b50);
  put16(eocdView, 8, entries.length);
  put16(eocdView, 10, entries.length);
  put32(eocdView, 12, centralSize);
  put32(eocdView, 16, localOffset);
  return new Blob([...localParts, ...centralParts, eocd], { type: "application/zip" });
}
