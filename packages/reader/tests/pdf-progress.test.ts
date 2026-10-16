import { describe, expect, it } from "vitest";
import {
  createPdfPageLocator,
  getPdfPageFromAnchor,
  toPdfProgressAnchor,
} from "../src/pdf-progress";

describe("PDF page progress", () => {
  it("creates exact one-based locators and compatible progress anchors", () => {
    expect(createPdfPageLocator(45, 200)).toEqual({
      format: "pdf",
      pageNumber: 45,
      totalPages: 200,
      percentage: 22.5,
    });
    expect(toPdfProgressAnchor(45, 200)).toEqual({ type: "page", page: 45, totalPages: 200 });
  });

  it("restores page anchors and clamps positions to the document bounds", () => {
    expect(getPdfPageFromAnchor({ type: "page", page: 12, totalPages: 20 }, 15)).toBe(12);
    expect(getPdfPageFromAnchor({ type: "page", page: 20, totalPages: 20 }, 15)).toBe(15);
    expect(getPdfPageFromAnchor({ type: "chapter", chapter: 3 }, 15)).toBe(1);
    expect(getPdfPageFromAnchor(null, 15)).toBe(1);
  });

  it("rejects invalid page locators", () => {
    expect(() => createPdfPageLocator(0, 10)).toThrow("within the document");
    expect(() => createPdfPageLocator(11, 10)).toThrow("within the document");
    expect(() => createPdfPageLocator(1, 0)).toThrow("positive integer");
  });
});
