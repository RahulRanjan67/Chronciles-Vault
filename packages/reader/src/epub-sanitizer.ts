import createDOMPurify from "dompurify";

const FORBID_TAGS = [
  "script",
  "object",
  "embed",
  "iframe",
  "frame",
  "frameset",
  "portal",
  "fencedframe",
  "webview",
  "foreignObject",
  "form",
  "input",
  "button",
  "video",
  "audio",
  "source",
  "track",
  "link",
  "meta",
  "base",
  "svg",
  "math",
  "style",
];

export function sanitizeEpubXhtml(source: string): string {
  if (typeof window === "undefined") {
    throw new Error("EPUB sanitization requires an active browser window.");
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
    throw new Error("The EPUB chapter contains a prohibited XML declaration.");
  }
  const xml = new DOMParser().parseFromString(source, "application/xhtml+xml");
  if (xml.getElementsByTagName("parsererror").length > 0) {
    throw new Error("The EPUB chapter is malformed XHTML.");
  }
  const forbidden = new Set(FORBID_TAGS.map((tag) => tag.toLowerCase()));
  for (const element of Array.from(xml.getElementsByTagName("*"))) {
    if (forbidden.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    if (element.localName.toLowerCase() === "img") {
      const sourceUrl = element.getAttribute("src");
      element.removeAttribute("data-gm-src");
      if (sourceUrl) {
        element.setAttribute("data-gm-src", sourceUrl);
        element.removeAttribute("src");
      }
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (
        name.startsWith("on") ||
        name === "style" ||
        name === "srcset" ||
        name === "formaction" ||
        name === "xlink:href" ||
        name === "background" ||
        name === "ping" ||
        name === "manifest" ||
        name === "srcdoc"
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  const body = Array.from(xml.getElementsByTagName("*")).find(
    (element) => element.localName.toLowerCase() === "body",
  );
  if (!body) throw new Error("The EPUB chapter has no readable body.");
  const serializer = new XMLSerializer();
  const inertMarkup = Array.from(body.childNodes)
    .map((node) => serializer.serializeToString(node))
    .join("");
  const purifier = createDOMPurify(window);
  const sanitized = purifier.sanitize(inertMarkup, {
    WHOLE_DOCUMENT: false,
    FORBID_TAGS,
    FORBID_ATTR: ["style", "srcset", "formaction", "xlink:href"],
    ADD_ATTR: ["data-gm-src"],
    ALLOW_DATA_ATTR: false,
    SANITIZE_NAMED_PROPS: true,
    RETURN_TRUSTED_TYPE: false,
  });
  const document = new DOMParser().parseFromString(String(sanitized), "text/html");
  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    if (forbidden.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    if (element.localName.toLowerCase() === "img") {
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name.toLowerCase() !== "data-gm-src") {
          element.removeAttribute(attribute.name);
        }
      }
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (
        name.startsWith("on") ||
        name === "style" ||
        name === "srcset" ||
        name === "formaction" ||
        name === "xlink:href" ||
        name === "background" ||
        name === "ping" ||
        name === "manifest" ||
        name === "srcdoc" ||
        /^(?:javascript|vbscript):/i.test(value) ||
        (name === "src" &&
          !/^(?:blob:|data:image\/(?:png|jpeg|webp|avif);base64,)/i.test(value) &&
          /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value))
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return document.body.innerHTML;
}

export const EPUB_CSP =
  "default-src 'none'; img-src blob: data:; style-src 'unsafe-inline'; font-src blob: data:; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";

export function buildEpubFrameHtml(content: string, readerCss: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${EPUB_CSP}"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readerCss}</style></head><body>${content}</body></html>`;
}
