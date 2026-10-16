import { describe, expect, it } from "vitest";
import { resolvePdfOutline, type PdfOutlineSource } from "../src/pdf-outline";

describe("PDF outline resolution", () => {
  it("resolves named destinations, page references, and nested entries", async () => {
    const source: PdfOutlineSource[] = [
      {
        title: "Chapter One",
        dest: "chapter-one",
        items: [{ title: "Section", dest: [{ num: 4, gen: 0 }] }],
      },
      { title: "Appendix", dest: [9] },
    ];
    const result = await resolvePdfOutline(source, {
      getDestination: async (name) => (name === "chapter-one" ? [{ num: 1, gen: 0 }] : null),
      getPageIndex: async (reference) => reference.num - 1,
    });

    expect(result).toEqual([
      {
        title: "Chapter One",
        pageNumber: 1,
        children: [{ title: "Section", pageNumber: 4, children: [] }],
      },
      { title: "Appendix", pageNumber: 10, children: [] },
    ]);
  });

  it("omits unresolved/external destinations and bounds deep trees", async () => {
    const source: PdfOutlineSource[] = [
      {
        title: "External",
        dest: null,
        url: "https://example.com",
        items: [{ title: "Valid child", dest: [0] }],
      },
      { title: "Unresolved", dest: "missing" },
    ];
    const result = await resolvePdfOutline(source, {
      getDestination: async () => null,
      getPageIndex: async () => 0,
    });
    expect(result).toEqual([{ title: "Valid child", pageNumber: 1, children: [] }]);

    let deepNode: PdfOutlineSource = { title: "Deep", dest: [0] };
    for (let depth = 0; depth < 20; depth += 1) {
      deepNode = { title: `Parent ${depth}`, dest: null, items: [deepNode] };
    }
    const boundedDeep = await resolvePdfOutline([deepNode], {
      getDestination: async () => null,
      getPageIndex: async () => 0,
    });
    expect(boundedDeep).toEqual([]);

    const wide = Array.from({ length: 1001 }, (_, index) => ({
      title: `Entry ${index}`,
      dest: [index],
    }));
    expect(
      await resolvePdfOutline(wide, {
        getDestination: async () => null,
        getPageIndex: async () => 0,
      }),
    ).toHaveLength(1000);
  });
});
