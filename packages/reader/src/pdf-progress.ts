import type { ProgressAnchor } from "@grimoire/domain";

export interface PdfPageLocator {
  readonly format: "pdf";
  readonly pageNumber: number;
  readonly totalPages: number;
  readonly percentage: number;
}

export function createPdfPageLocator(pageNumber: number, totalPages: number): PdfPageLocator {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error("PDF total pages must be a positive integer.");
  }
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
    throw new Error("PDF page number must be within the document.");
  }
  return {
    format: "pdf",
    pageNumber,
    totalPages,
    percentage: (pageNumber / totalPages) * 100,
  };
}

export function toPdfProgressAnchor(pageNumber: number, totalPages: number): ProgressAnchor {
  const locator = createPdfPageLocator(pageNumber, totalPages);
  return { type: "page", page: locator.pageNumber, totalPages: locator.totalPages };
}

export function getPdfPageFromAnchor(anchor: ProgressAnchor | null, totalPages: number): number {
  if (anchor?.type !== "page" || !Number.isInteger(anchor.page)) return 1;
  return Math.min(Math.max(anchor.page, 1), totalPages);
}
