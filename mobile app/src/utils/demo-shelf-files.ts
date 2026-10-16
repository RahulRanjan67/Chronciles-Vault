import { importLocalFile, listLocalFiles, setLocalFileWork } from "@chronicles-vault/reader";
import { clientRepository } from "@chronicles-vault/state";
import { AccessCapability, SourceHealth, createLocalFileAccessPath } from "@chronicles-vault/domain";

export interface ZipEntryData {
  readonly name: string;
  readonly data: Uint8Array;
}

function put16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function put32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildStoredZip(entries: readonly ZipEntryData[]): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  let centralSize = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = computeCrc32(entry.data);
    const local = new Uint8Array(30 + nameBytes.length + entry.data.length);
    const localView = new DataView(local.buffer);
    put32(localView, 0, 0x04034b50);
    put16(localView, 4, 20);
    put16(localView, 6, 0x0800);
    put16(localView, 8, 0); // Stored (no compression)
    put32(localView, 14, crc);
    put32(localView, 18, entry.data.length);
    put32(localView, 22, entry.data.length);
    put16(localView, 26, nameBytes.length);
    local.set(nameBytes, 30);
    local.set(entry.data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    put32(centralView, 0, 0x02014b50);
    put16(centralView, 4, 20);
    put16(centralView, 6, 20);
    put16(centralView, 8, 0x0800);
    put16(centralView, 10, 0);
    put32(centralView, 16, crc);
    put32(centralView, 20, entry.data.length);
    put32(centralView, 24, entry.data.length);
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
  return new Blob([...localParts, ...centralParts, eocd] as unknown as BlobPart[], {
    type: "application/zip",
  });
}

export function createDemoPdfFile(): File {
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 135 >>
stream
BT
/F1 22 Tf
50 720 Td
(Chronicles Vault - Reading Demonstration Document) Tj
/F1 13 Tf
0 -36 Td
(Welcome to the offline, DRM-free sandboxed reader.) Tj
0 -24 Td
(Progress tracking, bookmarks, and search are enabled.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000428 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
506
%%EOF`;
  return new File([pdfString], "Chronicles_Vault_Guide.pdf", { type: "application/pdf" });
}

export function createDemoEpubFile(): File {
  const enc = new TextEncoder();
  const entries: ZipEntryData[] = [
    {
      name: "mimetype",
      data: enc.encode("application/epub+zip"),
    },
    {
      name: "META-INF/container.xml",
      data: enc.encode(
        '<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">' +
          '<rootfiles><rootfile full-path="OPS/book.opf" media-type="application/oebps-package+xml"/></rootfiles>' +
          '</container>',
      ),
    },
    {
      name: "OPS/book.opf",
      data: enc.encode(
        '<?xml version="1.0" encoding="utf-8"?>' +
          '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">' +
          '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
          '<dc:identifier id="pub-id">urn:uuid:cv-demo-epub-01</dc:identifier>' +
          '<dc:title>Chronicles of the Vault - Volume 1</dc:title>' +
          '<dc:language>en</dc:language>' +
          '<dc:creator>Archivist</dc:creator>' +
          '</metadata>' +
          '<manifest>' +
          '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>' +
          '<item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>' +
          '<item id="ch2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>' +
          '</manifest>' +
          '<spine>' +
          '<itemref idref="ch1"/>' +
          '<itemref idref="ch2"/>' +
          '</spine>' +
          '</package>',
      ),
    },
    {
      name: "OPS/nav.xhtml",
      data: enc.encode(
        '<?xml version="1.0" encoding="utf-8"?>' +
          '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
          '<head><title>Table of Contents</title></head>' +
          '<body>' +
          '<nav epub:type="toc" id="toc">' +
          '<h1>Table of Contents</h1>' +
          '<ol>' +
          '<li><a href="chapter1.xhtml#start">Chapter 1: The First Descent</a></li>' +
          '<li><a href="chapter2.xhtml#start">Chapter 2: Memory Inscriptions</a></li>' +
          '</ol>' +
          '</nav>' +
          '</body>' +
          '</html>',
      ),
    },
    {
      name: "OPS/chapter1.xhtml",
      data: enc.encode(
        '<?xml version="1.0" encoding="utf-8"?>' +
          '<html xmlns="http://www.w3.org/1999/xhtml">' +
          '<head><title>Chapter 1: The First Descent</title></head>' +
          '<body>' +
          '<h1 id="start">Chapter 1: The First Descent</h1>' +
          '<p>The massive bronze vault doors unlocked with a resonant chime, revealing endless shelves of preserved fiction.</p>' +
          '<p>Every story ever recorded remained untouched by the decay of transient websites, held permanently in offline sovereignty.</p>' +
          '<p>The reader stepped across the threshold, turning to the catalog of recorded journeys.</p>' +
          '</body>' +
          '</html>',
      ),
    },
    {
      name: "OPS/chapter2.xhtml",
      data: enc.encode(
        '<?xml version="1.0" encoding="utf-8"?>' +
          '<html xmlns="http://www.w3.org/1999/xhtml">' +
          '<head><title>Chapter 2: Memory Inscriptions</title></head>' +
          '<body>' +
          '<h1 id="start">Chapter 2: Memory Inscriptions</h1>' +
          '<p>Carved in script along the marble archways were quotes, theories, and reflections left behind by previous readers.</p>' +
          '<p>In the Memory Vault, every reader retains their personal journey, unaffected by future domain changes or source disappearance.</p>' +
          '</body>' +
          '</html>',
      ),
    },
  ];

  const blob = buildStoredZip(entries);
  return new File([blob], "Chronicles_of_the_Vault_Vol1.epub", {
    type: "application/epub+zip",
  });
}

function createPngPage(width: number, height: number, pageTitle: string, pageNum: number): Uint8Array {
  // Generate a valid PNG with IHDR, IDAT, IEND chunks
  // Or render via canvas when in browser environment
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Dark slate background
      ctx.fillStyle = pageNum % 2 === 1 ? "#0f172a" : "#1e1b4b";
      ctx.fillRect(0, 0, width, height);

      // Border
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pageTitle, width / 2, 100);

      // Comic panel boxes
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(40, 140, width - 80, 220);
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 140, width - 80, 220);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "18px sans-serif";
      ctx.fillText(`[ Comic Panel: Scene ${pageNum}A ]`, width / 2, 250);

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(40, 380, width - 80, 220);
      ctx.strokeRect(40, 380, width - 80, 220);

      ctx.fillStyle = "#f59e0b";
      ctx.fillText(`[ Comic Panel: Scene ${pageNum}B ]`, width / 2, 490);

      // Page footer
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px monospace";
      ctx.fillText(`- Page ${pageNum} -`, width / 2, height - 30);

      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1] ?? "";
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  }

  // Fallback minimal 1x1 transparent PNG if canvas is unavailable
  const fallbackPng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x01, 0x90, 0x00, 0x00, 0x02, 0xbc, // 400 x 700
    0x08, 0x02, 0x00, 0x00, 0x00, 0x85, 0x05, 0x4c, 0xcf,
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82,
  ]);
  return fallbackPng;
}

export function createDemoCbzFile(): File {
  const page1 = createPngPage(480, 720, "Vault Chronicles - Prologue", 1);
  const page2 = createPngPage(480, 720, "Vault Chronicles - Awakening", 2);
  const page3 = createPngPage(480, 720, "Vault Chronicles - Revelation", 3);

  const entries: ZipEntryData[] = [
    { name: "01_cover.png", data: page1 },
    { name: "02_page.png", data: page2 },
    { name: "03_page.png", data: page3 },
  ];

  const blob = buildStoredZip(entries);
  return new File([blob], "Vault_Chronicles_Chapter_01.cbz", {
    type: "application/vnd.comicbook+zip",
  });
}

export async function seedDemoShelfFiles(): Promise<number> {
  const existing = await listLocalFiles();
  let count = 0;

  // 1. Demo EPUB
  if (!existing.some((f) => f.format === "epub")) {
    const epub = createDemoEpubFile();
    const stored = await importLocalFile(epub);
    // Link to Omniscient Reader or Frieren if available
    const item = clientRepository.getItems().find((i) => i.work.id === "work-orv");
    if (item) {
      await setLocalFileWork(stored.id, item.work.id);
      clientRepository.addAccessPath(
        item.work.id,
        createLocalFileAccessPath({
          workId: item.work.id,
          filePath: `chronicles-vault://local-file/${encodeURIComponent(stored.id)}`,
          fileId: stored.id,
          format: "epub",
          provider: "local-reader",
          label: stored.displayName,
          isPreferred: false,
          health: SourceHealth.Local,
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          provenance: { importedAt: stored.importedAt, contentHash: stored.contentHash },
          lastOpenedAt: null,
        }),
      );
    }
    count++;
  }

  // 2. Demo CBZ
  if (!existing.some((f) => f.format === "cbz")) {
    const cbz = createDemoCbzFile();
    await importLocalFile(cbz);
    count++;
  }

  // 3. Demo PDF
  if (!existing.some((f) => f.format === "pdf")) {
    const pdf = createDemoPdfFile();
    const stored = await importLocalFile(pdf);
    // Link to Dungeon Meshi if available
    const item = clientRepository.getItems().find((i) => i.work.id === "work-dungeon-meshi");
    if (item) {
      await setLocalFileWork(stored.id, item.work.id);
      clientRepository.addAccessPath(
        item.work.id,
        createLocalFileAccessPath({
          workId: item.work.id,
          filePath: `chronicles-vault://local-file/${encodeURIComponent(stored.id)}`,
          fileId: stored.id,
          format: "pdf",
          provider: "local-reader",
          label: stored.displayName,
          isPreferred: true,
          health: SourceHealth.Local,
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          provenance: { importedAt: stored.importedAt, contentHash: stored.contentHash },
          lastOpenedAt: null,
        }),
      );
    }
    count++;
  }

  return count;
}
