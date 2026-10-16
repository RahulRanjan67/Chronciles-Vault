export interface PdfTextMatch {
  readonly pageNumber: number;
  readonly excerpt: string;
  readonly matchIndex: number;
  readonly startOffset: number;
  readonly endOffset: number;
}

export function findPdfTextMatches(
  pageText: readonly string[],
  query: string,
  limit = 100,
): PdfTextMatch[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("PDF search result limit must be a positive integer.");
  }

  const matches: PdfTextMatch[] = [];
  pageText.forEach((text, pageIndex) => {
    const normalized = text.replace(/\s+/g, " ");
    const searchable = normalized.toLocaleLowerCase();
    let offset = 0;
    while (matches.length < limit) {
      const foundAt = searchable.indexOf(needle, offset);
      if (foundAt < 0) break;
      const start = Math.max(0, foundAt - 48);
      const end = Math.min(normalized.length, foundAt + needle.length + 64);
      matches.push({
        pageNumber: pageIndex + 1,
        excerpt: `${start > 0 ? "…" : ""}${normalized.slice(start, end)}${
          end < normalized.length ? "…" : ""
        }`,
        matchIndex: matches.length,
        startOffset: foundAt,
        endOffset: foundAt + needle.length,
      });
      offset = foundAt + needle.length;
    }
  });
  return matches;
}
