import { describe, expect, it } from "vitest";
import { findPdfTextMatches } from "../src/pdf-search";

describe("PDF text search", () => {
  it("returns case-insensitive excerpts with one-based page numbers", () => {
    expect(
      findPdfTextMatches(["An intro", "A quick brown fox jumps over the fence"], "BROWN"),
    ).toEqual([
      {
        pageNumber: 2,
        excerpt: "A quick brown fox jumps over the fence",
        matchIndex: 0,
        startOffset: 8,
        endOffset: 13,
      },
    ]);
  });

  it("finds repeated occurrences in order and respects the result limit", () => {
    const results = findPdfTextMatches(["one one", "one"], "one", 2);
    expect(results).toHaveLength(2);
    expect(results.map((match) => [match.pageNumber, match.startOffset])).toEqual([
      [1, 0],
      [1, 4],
    ]);
  });

  it("returns no results for blank queries and rejects invalid limits", () => {
    expect(findPdfTextMatches(["some text"], "  ")).toEqual([]);
    expect(() => findPdfTextMatches([], "text", 0)).toThrow("positive integer");
  });
});
