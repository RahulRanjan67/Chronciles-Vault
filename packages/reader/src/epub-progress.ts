import type { ProgressAnchor } from "@grimoire/domain";

export interface EpubLocator {
  readonly format: "epub";
  readonly cfi: string;
  readonly percentage: number;
  readonly chapterTitle?: string;
  readonly spineIndex: number;
}

export interface EpubCfiPosition {
  readonly spineIndex: number;
  readonly steps: readonly number[];
  readonly characterOffset: number;
}

export function createEpubCfi(
  spineIndex: number,
  steps: readonly number[],
  characterOffset: number,
): string {
  if (
    !Number.isInteger(spineIndex) ||
    spineIndex < 0 ||
    steps.length > 100 ||
    steps.some((step) => !Number.isSafeInteger(step) || step < 1) ||
    !Number.isSafeInteger(characterOffset) ||
    characterOffset < 0
  ) {
    throw new RangeError("The EPUB location is invalid.");
  }
  const path = steps.length > 0 ? `/${steps.join("/")}` : "";
  const cfi = `epubcfi(/6/${(spineIndex + 1) * 2}!/4${path}:${characterOffset})`;
  if (cfi.length > 2048) throw new RangeError("The EPUB location is too long.");
  return cfi;
}

export function parseEpubCfi(cfi: string): EpubCfiPosition {
  if (cfi.length > 2048) throw new Error("The saved EPUB CFI is too long.");
  const match = /^epubcfi\(\/6\/(\d+)!\/4((?:\/\d+)*):(\d+)\)$/.exec(cfi);
  if (!match) throw new Error("The saved EPUB CFI is malformed.");
  const spineStep = Number(match[1]);
  const characterOffset = Number(match[3]);
  const steps = match[2] ? match[2].slice(1).split("/").map(Number) : [];
  if (
    spineStep < 2 ||
    spineStep % 2 !== 0 ||
    !Number.isSafeInteger(spineStep) ||
    !Number.isSafeInteger(characterOffset) ||
    steps.length > 100 ||
    steps.some((step) => !Number.isSafeInteger(step) || step < 1)
  ) {
    throw new Error("The saved EPUB CFI is invalid.");
  }
  return { spineIndex: spineStep / 2 - 1, steps, characterOffset };
}

export function calculateEpubPercentage(
  spineIndex: number,
  totalSpineItems: number,
  chapterProgress: number,
): number {
  if (
    !Number.isInteger(totalSpineItems) ||
    totalSpineItems < 1 ||
    !Number.isFinite(spineIndex) ||
    !Number.isFinite(chapterProgress)
  ) {
    return 0;
  }
  const boundedSpine = Math.min(Math.max(spineIndex, 0), totalSpineItems - 1);
  const boundedChapter = Math.min(Math.max(chapterProgress, 0), 1);
  return Math.min(100, ((boundedSpine + boundedChapter) / totalSpineItems) * 100);
}

export function epubAnchorFromLocator(locator: EpubLocator): ProgressAnchor {
  return {
    type: "epub_locator",
    cfi: locator.cfi,
    percent: locator.percentage,
    chapterTitle: locator.chapterTitle,
  };
}

export function getEpubInitialCfi(anchor: ProgressAnchor | null): string | null {
  return anchor?.type === "epub_locator" ? anchor.cfi : null;
}
