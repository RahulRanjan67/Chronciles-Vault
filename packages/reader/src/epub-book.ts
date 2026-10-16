import { SafeZipArchive, validateZipEntryPath } from "./safe-zip.js";
import type { ZipEntry } from "./safe-zip.js";

const EPUB_LIMITS = {
  maxDirectoryBytes: 64 * 1024,
  maxEntries: 2000,
  maxEntryBytes: 60 * 1024 * 1024,
  maxTotalBytes: 256 * 1024 * 1024,
  maxCompressionRatio: 100,
} as const;
const MAX_CHAPTER_BYTES = 8 * 1024 * 1024;
const MAX_TOC_ITEMS = 1000;
const MAX_TOC_DEPTH = 12;
const EPUB_OPS_NAMESPACE = "http://www.idpf.org/2007/ops";

export interface EpubTocItem {
  readonly id: string;
  readonly title: string;
  readonly spineIndex: number;
  readonly fragment: string | null;
  readonly children: readonly EpubTocItem[];
}

export interface EpubChapter {
  readonly index: number;
  readonly path: string;
  readonly title: string;
  readonly content: string;
}

export interface ResolvedEpubHref {
  readonly path: string;
  readonly fragment: string | null;
}

interface ManifestItem {
  readonly id: string;
  readonly path: string;
  readonly mediaType: string;
  readonly properties: readonly string[];
  readonly entry: ZipEntry;
}

interface TocLink {
  readonly href: string;
  readonly title: string;
  readonly children: readonly TocLink[];
}

function xmlDocument(source: string, name: string): Document {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
    throw new Error(`The EPUB ${name} contains a prohibited XML declaration.`);
  }
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error(`The EPUB ${name} is malformed XML.`);
  }
  return document;
}

function requiredAttribute(element: Element, name: string): string {
  const value = element.getAttribute(name)?.trim();
  if (!value) throw new Error(`The EPUB package is missing ${name}.`);
  return value;
}

function archivePath(path: string): string {
  let normalized: string;
  try {
    normalized = decodeURIComponent(path.replace(/^\/+/, ""));
  } catch {
    throw new Error("The EPUB package path is malformed.");
  }
  validateZipEntryPath(normalized);
  return normalized;
}

export function resolveEpubHref(basePath: string, href: string): ResolvedEpubHref | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const hashIndex = trimmed.indexOf("#");
  const queryIndex = trimmed.indexOf("?");
  const pathEnd = Math.min(
    hashIndex < 0 ? trimmed.length : hashIndex,
    queryIndex < 0 ? trimmed.length : queryIndex,
  );
  const pathPart = trimmed.slice(0, pathEnd);
  let decodedPath: string;
  let fragment: string | null = null;
  try {
    decodedPath = decodeURIComponent(pathPart);
    if (hashIndex >= 0) {
      const fragmentEnd = queryIndex > hashIndex ? queryIndex : trimmed.length;
      fragment = decodeURIComponent(trimmed.slice(hashIndex + 1, fragmentEnd));
    }
  } catch {
    return null;
  }

  if (!decodedPath) return { path: basePath, fragment };
  const segments = pathPart.startsWith("/") ? [] : basePath.split("/").slice(0, -1);
  for (const segment of decodedPath.replace(/\\/g, "/").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (segments.length === 0) return null;
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  if (segments.length === 0) return null;
  const path = segments.join("/");
  try {
    validateZipEntryPath(path);
  } catch {
    return null;
  }
  return { path, fragment };
}

function text(element: Element | null): string {
  return element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function elementsByLocalName(document: Document, name: string): Element[] {
  return Array.from(document.getElementsByTagName("*")).filter(
    (element) => element.localName === name,
  );
}

function parseNavLinks(
  list: Element,
  basePath: string,
  spineIndexes: ReadonlyMap<string, number>,
  depth: number,
  counter: { count: number },
): TocLink[] {
  if (depth > MAX_TOC_DEPTH || counter.count >= MAX_TOC_ITEMS) return [];
  const links: TocLink[] = [];
  for (const li of Array.from(list.children).filter((child) => child.localName === "li")) {
    if (counter.count >= MAX_TOC_ITEMS) break;
    const link = Array.from(li.children).find(
      (child) => child.localName === "a" || child.localName === "span",
    );
    const rawHref = link?.getAttribute("href") ?? "";
    const resolved = rawHref ? resolveEpubHref(basePath, rawHref) : null;
    const spineIndex = resolved ? spineIndexes.get(resolved.path) : undefined;
    const nestedList = Array.from(li.children).find((child) => child.localName === "ol");
    const children = nestedList
      ? parseNavLinks(nestedList, basePath, spineIndexes, depth + 1, counter)
      : [];
    const title = text(link ?? li).slice(0, 300);
    if (spineIndex !== undefined && title) {
      counter.count += 1;
      links.push({
        href: `${spineIndex}${resolved?.fragment ? `#${resolved.fragment}` : ""}`,
        title,
        children,
      });
    } else {
      links.push(...children);
    }
  }
  return links;
}

function parseNcxLinks(
  navPoint: Element,
  basePath: string,
  spineIndexes: ReadonlyMap<string, number>,
  depth: number,
  counter: { count: number },
): TocLink[] {
  if (depth > MAX_TOC_DEPTH || counter.count >= MAX_TOC_ITEMS) return [];
  const links: TocLink[] = [];
  for (const point of Array.from(navPoint.children).filter(
    (child) => child.localName === "navPoint",
  )) {
    if (counter.count >= MAX_TOC_ITEMS) break;
    const label = Array.from(point.children).find((child) => child.localName === "navLabel");
    const content = Array.from(point.children).find((child) => child.localName === "content");
    const resolved = content ? resolveEpubHref(basePath, content.getAttribute("src") ?? "") : null;
    const spineIndex = resolved ? spineIndexes.get(resolved.path) : undefined;
    const title = text(label ?? point).slice(0, 300);
    const children = parseNcxLinks(point, basePath, spineIndexes, depth + 1, counter);
    if (spineIndex !== undefined && title) {
      counter.count += 1;
      links.push({
        href: `${spineIndex}${resolved?.fragment ? `#${resolved.fragment}` : ""}`,
        title,
        children,
      });
    } else {
      links.push(...children);
    }
  }
  return links;
}

export class EpubBook {
  private constructor(
    private readonly archive: SafeZipArchive,
    readonly title: string,
    readonly chapterPaths: readonly string[],
    readonly toc: readonly EpubTocItem[],
    private readonly chapterTitles: readonly string[],
  ) {}

  static async open(blob: Blob): Promise<EpubBook> {
    const archive = await SafeZipArchive.open(blob, EPUB_LIMITS);
    const containerEntry = archive.entries.find((entry) => entry.name === "META-INF/container.xml");
    if (!containerEntry) throw new Error("The EPUB package container is missing.");
    if (containerEntry.uncompressedSize > 2 * 1024 * 1024) {
      throw new Error("The EPUB package container exceeds the safe parsing limit.");
    }
    const containerXml = new TextDecoder("utf-8", { fatal: true }).decode(
      await archive.read(containerEntry),
    );
    const container = xmlDocument(containerXml, "container");
    const rootfile = elementsByLocalName(container, "rootfile")[0];
    if (!rootfile) throw new Error("The EPUB package document is missing.");
    const packagePath = archivePath(requiredAttribute(rootfile, "full-path"));
    const packageEntry = archive.entries.find((entry) => entry.name === packagePath);
    if (!packageEntry || packageEntry.uncompressedSize > 2 * 1024 * 1024) {
      throw new Error("The EPUB package document is unavailable or too large.");
    }
    const packageXml = new TextDecoder("utf-8", { fatal: true }).decode(
      await archive.read(packageEntry),
    );
    const packageDocument = xmlDocument(packageXml, "package document");
    const manifestElements = elementsByLocalName(packageDocument, "item");
    const manifest = new Map<string, ManifestItem>();
    for (const element of manifestElements) {
      const id = requiredAttribute(element, "id");
      const href = requiredAttribute(element, "href");
      const resolved = resolveEpubHref(packagePath, href);
      if (!resolved || resolved.fragment) continue;
      const entry = archive.entries.find((item) => item.name === resolved.path);
      if (!entry) continue;
      manifest.set(id, {
        id,
        path: resolved.path,
        mediaType: element.getAttribute("media-type") ?? "",
        properties: (element.getAttribute("properties") ?? "").split(/\s+/).filter(Boolean),
        entry,
      });
    }
    const spineElement = elementsByLocalName(packageDocument, "spine")[0];
    if (!spineElement) throw new Error("The EPUB package has no reading order.");
    const spineItems: ManifestItem[] = [];
    for (const itemref of Array.from(spineElement.getElementsByTagName("*")).filter(
      (element) => element.localName === "itemref",
    )) {
      const item = manifest.get(requiredAttribute(itemref, "idref"));
      if (
        item &&
        (item.mediaType === "application/xhtml+xml" ||
          item.mediaType === "text/html" ||
          /\.x?html?$/i.test(item.path))
      ) {
        spineItems.push(item);
      }
    }
    if (spineItems.length === 0) throw new Error("The EPUB package has no readable chapters.");

    const chapterPaths = spineItems.map((item) => item.path);
    const spineIndexes = new Map(chapterPaths.map((path, index) => [path, index]));
    const navItem = Array.from(manifest.values()).find((item) => item.properties.includes("nav"));
    let rawToc: TocLink[] = [];
    if (navItem) {
      const navBytes = await archive.read(navItem.entry);
      if (navBytes.byteLength <= MAX_CHAPTER_BYTES) {
        const navDocument = xmlDocument(
          new TextDecoder("utf-8", { fatal: true }).decode(navBytes),
          "navigation document",
        );
        const navElement = elementsByLocalName(navDocument, "nav").find((element) => {
          const epubType =
            element.getAttributeNS(EPUB_OPS_NAMESPACE, "type") ??
            element.getAttribute("epub:type") ??
            "";
          return epubType.split(/\s+/).includes("toc") || element.getAttribute("id") === "toc";
        });
        const list = navElement
          ? Array.from(navElement.children).find((child) => child.localName === "ol")
          : undefined;
        if (list) rawToc = parseNavLinks(list, navItem.path, spineIndexes, 0, { count: 0 });
      }
    }
    if (rawToc.length === 0) {
      const tocId = spineElement.getAttribute("toc");
      const ncxItem = tocId ? manifest.get(tocId) : undefined;
      if (ncxItem) {
        const ncxBytes = await archive.read(ncxItem.entry);
        if (ncxBytes.byteLength <= MAX_CHAPTER_BYTES) {
          const ncx = xmlDocument(
            new TextDecoder("utf-8", { fatal: true }).decode(ncxBytes),
            "NCX navigation",
          );
          const navMap = elementsByLocalName(ncx, "navMap")[0];
          if (navMap) rawToc = parseNcxLinks(navMap, ncxItem.path, spineIndexes, 0, { count: 0 });
        }
      }
    }
    const chapterTitles = chapterPaths.map(
      (_path, index) => findTocTitle(rawToc, index) ?? `Chapter ${index + 1}`,
    );
    let tocId = 0;
    const buildToc = (items: readonly TocLink[]): EpubTocItem[] =>
      items.map((item) => {
        const [indexText, fragment = ""] = item.href.split("#");
        const spineIndex = Number(indexText);
        return {
          id: `epub-toc-${tocId++}`,
          title: item.title,
          spineIndex,
          fragment: fragment || null,
          children: buildToc(item.children),
        };
      });
    const titleElement =
      packageDocument.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "title").item(0) ??
      elementsByLocalName(packageDocument, "title")[0];
    const title = text(titleElement ?? null) || "Untitled EPUB";
    return new EpubBook(archive, title, chapterPaths, buildToc(rawToc), chapterTitles);
  }

  async loadChapter(index: number, signal?: AbortSignal): Promise<EpubChapter> {
    const path = this.chapterPaths[index];
    if (!path) throw new RangeError("The selected EPUB chapter does not exist.");
    const entry = this.archive.entries.find((item) => item.name === path);
    if (!entry || entry.uncompressedSize > MAX_CHAPTER_BYTES) {
      throw new Error("This EPUB chapter exceeds the safe rendering limit.");
    }
    const bytes = await this.archive.read(entry, signal);
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/<!DOCTYPE|<!ENTITY/i.test(content)) {
      throw new Error("This EPUB chapter contains a prohibited XML declaration.");
    }
    return {
      index,
      path,
      title: this.chapterTitles[index] ?? `Chapter ${index + 1}`,
      content,
    };
  }

  async loadResource(
    path: string,
    signal?: AbortSignal,
    maxBytes = 60 * 1024 * 1024,
  ): Promise<Uint8Array> {
    validateZipEntryPath(path);
    const entry = this.archive.entries.find((item) => item.name === path);
    if (!entry) throw new Error("The EPUB resource was not found.");
    if (entry.uncompressedSize > Math.min(maxBytes, 60 * 1024 * 1024)) {
      throw new Error("The EPUB resource exceeds the safe rendering limit.");
    }
    return this.archive.read(entry, signal);
  }
}

function findTocTitle(items: readonly TocLink[], targetIndex: number): string | undefined {
  for (const item of items) {
    const [indexText] = item.href.split("#");
    if (Number(indexText) === targetIndex) return item.title;
    const childTitle = findTocTitle(item.children, targetIndex);
    if (childTitle) return childTitle;
  }
  return undefined;
}
