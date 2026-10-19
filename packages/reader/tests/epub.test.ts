import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EpubBook, resolveEpubHref } from "../src/epub-book";
import { calculateEpubPercentage, createEpubCfi, parseEpubCfi } from "../src/epub-progress";
import { EPUB_CSP, sanitizeEpubXhtml } from "../src/epub-sanitizer";
import { createStoredZip } from "./zip-fixture";

const previousWindow = globalThis.window;
const previousParser = globalThis.DOMParser;
const previousSerializer = globalThis.XMLSerializer;
const browserWindow = new JSDOM("", { url: "https://grimoire.invalid" }).window;

beforeEach(() => {
  globalThis.window = browserWindow as unknown as Window & typeof globalThis;
  globalThis.DOMParser = browserWindow.DOMParser;
  globalThis.XMLSerializer = browserWindow.XMLSerializer;
});

describe("EPUB package and locator handling", () => {
  it("reads bounded chapters and constructs a linked EPUB 3 table of contents", async () => {
    const archive = createStoredZip([
      {
        name: "META-INF/container.xml",
        data: new TextEncoder().encode(
          '<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>',
        ),
      },
      {
        name: "OPS/book.opf",
        data: new TextEncoder().encode(
          '<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" version="3.0"><metadata><dc:title>Test Book</dc:title></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ch1" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="ch1"/></spine></package>',
        ),
      },
      {
        name: "OPS/nav.xhtml",
        data: new TextEncoder().encode(
          '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="chapter.xhtml#start">Opening</a></li></ol></nav></body></html>',
        ),
      },
      {
        name: "OPS/chapter.xhtml",
        data: new TextEncoder().encode(
          '<html xmlns="http://www.w3.org/1999/xhtml"><body><p id="start">A local chapter.</p></body></html>',
        ),
      },
    ]);

    const book = await EpubBook.open(archive);
    expect(book.title).toBe("Test Book");
    expect(book.chapterPaths).toEqual(["OPS/chapter.xhtml"]);
    expect(book.toc[0]).toMatchObject({
      title: "Opening",
      spineIndex: 0,
      fragment: "start",
    });
    expect((await book.loadChapter(0)).content).toContain("A local chapter.");
    await expect(book.loadChapter(4)).rejects.toThrow("does not exist");
  });

  it("rejects entity declarations and prevents href path escapes or remote resources", () => {
    expect(() => sanitizeEpubXhtml("<!DOCTYPE x [<!ENTITY y SYSTEM 'file:///x'>]>")).toThrow();
    expect(resolveEpubHref("OPS/chapter.xhtml", "../Images/p.png")).toEqual({
      path: "Images/p.png",
      fragment: null,
    });
    expect(resolveEpubHref("OPS/chapter.xhtml", "../../../outside")).toBeNull();
    expect(resolveEpubHref("OPS/chapter.xhtml", "%2e%2e/%2e%2e/outside")).toBeNull();
    expect(resolveEpubHref("OPS/chapter.xhtml", "https://outside.invalid/x")).toBeNull();
    expect(resolveEpubHref("OPS/chapter.xhtml", "#section")).toEqual({
      path: "OPS/chapter.xhtml",
      fragment: "section",
    });
  });

  it("creates exact CFI round trips and bounded spine percentages", () => {
    const cfi = createEpubCfi(3, [2, 4, 1], 24);
    expect(cfi).toBe("epubcfi(/6/8!/4/2/4/1:24)");
    expect(parseEpubCfi(cfi)).toEqual({
      spineIndex: 3,
      steps: [2, 4, 1],
      characterOffset: 24,
    });
    expect(calculateEpubPercentage(3, 10, 0.5)).toBe(35);
    expect(calculateEpubPercentage(20, 10, 2)).toBe(100);
    expect(() => parseEpubCfi("epubcfi(/6/3!/4/2:0)")).toThrow("invalid");
  });

  it("strips active markup and declares a non-scriptable, network-restricted frame", () => {
    const unsafe =
      '<html xmlns="http://www.w3.org/1999/xhtml"><body><p onclick="alert(1)">safe <script>alert(2)</script><iframe src="https://bad.invalid"></iframe><img src="x" onerror="alert(3)" /><svg xmlns="http://www.w3.org/2000/svg"><foreignObject><img src="x" /></foreignObject></svg></p></body></html>';
    const clean = sanitizeEpubXhtml(unsafe);
    expect(clean).toContain("safe");
    expect(clean).not.toMatch(/<script|<iframe|foreignObject|onclick|onerror/i);
    expect(clean).toContain('data-gm-src="x"');
    expect(clean).not.toMatch(/src="https:\/\/bad.invalid/i);
    expect(EPUB_CSP).toContain("default-src 'none'");
    expect(EPUB_CSP).toContain("script-src 'none'");
    expect(EPUB_CSP).toContain("img-src blob: data:");
  });
});

afterEach(() => {
  globalThis.window = previousWindow;
  globalThis.DOMParser = previousParser;
  globalThis.XMLSerializer = previousSerializer;
});
