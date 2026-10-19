import { describe, expect, it } from "vitest";
import { parseRadarImport, sanitizeRadarCaptureUrl } from "../src/radar-import";
import { useRadarStore } from "../src/stores/use-radar-store";

const sample = {
  format: "grimoire-radar",
  version: 1,
  batchId: "batch-1",
  batchLabel: "Current window",
  browserSource: "chromium",
  capturedAt: "2026-10-04T10:00:00.000Z",
  items: [
    {
      id: "capture-1",
      url: "https://example.com/series/one?utm_source=browser",
      title: "Series One - Chapter 12",
      capturedAt: "2026-10-04T10:00:00.000Z",
      windowId: 1,
      tabId: 2,
    },
    {
      id: "capture-2",
      url: "https://EXAMPLE.com/series/one",
      title: "Duplicate URL",
      capturedAt: "2026-10-04T10:00:00.000Z",
    },
  ],
};

describe("Radar capture import", () => {
  it("validates exports, canonicalizes URLs, and deduplicates within a batch", () => {
    const result = parseRadarImport(JSON.stringify(sample));
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.normalizedUrl).toBe("https://example.com/series/one");
    expect(result.items[0]?.browserSource).toBe("chromium");
  });

  it("keeps repeat captures outside the 24-hour duplicate window", () => {
    const result = parseRadarImport(
      JSON.stringify({
        ...sample,
        items: [
          { ...sample.items[0], capturedAt: "2026-10-01T10:00:00.000Z" },
          {
            ...sample.items[1],
            id: "capture-later",
            capturedAt: "2026-10-03T10:00:00.000Z",
          },
        ],
      }),
    );
    expect(result.items).toHaveLength(2);
  });

  it("rejects malformed files and non-web URLs", () => {
    expect(() => parseRadarImport("{")).toThrow("not valid JSON");
    expect(() =>
      parseRadarImport(
        JSON.stringify({
          ...sample,
          items: [{ ...sample.items[0], url: "javascript:alert(1)" }],
        }),
      ),
    ).toThrow("non-HTTP(S) URL");
  });

  it("rejects URLs containing embedded credentials", () => {
    expect(() =>
      parseRadarImport(
        JSON.stringify({
          ...sample,
          items: [{ ...sample.items[0], url: "https://reader:secret@example.com/chapter" }],
        }),
      ),
    ).toThrow("embedded credentials");
  });

  it("removes secrets from query parameters before storing capture URLs", () => {
    const result = parseRadarImport(
      JSON.stringify({
        ...sample,
        items: [
          { ...sample.items[0], url: "https://example.com/chapter?accessToken=private&chapter=4" },
        ],
      }),
    );
    expect(result.items[0]?.url).toBe("https://example.com/chapter?chapter=4");
    expect(result.items[0]?.normalizedUrl).toBe("https://example.com/chapter?chapter=4");
  });

  it("removes case-insensitive session identifiers before storing", () => {
    expect(
      sanitizeRadarCaptureUrl("https://example.com/chapter?sessionId=private&chapter=4").url,
    ).toBe("https://example.com/chapter?chapter=4");
  });

  it("imports idempotently within 24 hours and preserves triage state", () => {
    useRadarStore.setState({ items: [], pendingCount: 0 });
    const first = parseRadarImport(JSON.stringify({ ...sample, items: [sample.items[0]] }));
    const second = parseRadarImport(
      JSON.stringify({
        ...sample,
        batchId: "batch-2",
        capturedAt: "2026-10-04T11:00:00.000Z",
        items: [
          {
            ...sample.items[0],
            id: "capture-2",
            url: "https://EXAMPLE.com/series/one?utm_campaign=repeat",
            capturedAt: "2026-10-04T11:00:00.000Z",
          },
        ],
      }),
    );
    expect(useRadarStore.getState().importBatch(first)).toEqual({ imported: 1, duplicates: 0 });
    expect(useRadarStore.getState().importBatch(second)).toEqual({ imported: 0, duplicates: 1 });
    useRadarStore.getState().keepTemporary("capture-1");
    expect(useRadarStore.getState().items[0]?.state).toBe("temporary");
    expect(useRadarStore.getState().pendingCount).toBe(0);

    const later = parseRadarImport(
      JSON.stringify({
        ...sample,
        batchId: "batch-3",
        capturedAt: "2026-10-05T12:00:00.000Z",
        items: [
          {
            ...sample.items[0],
            id: "capture-3",
            capturedAt: "2026-10-05T12:00:00.000Z",
          },
        ],
      }),
    );
    expect(useRadarStore.getState().importBatch(later)).toEqual({ imported: 1, duplicates: 0 });
  });

  it("enforces the batch size limit", () => {
    expect(() => parseRadarImport(" ".repeat(4 * 1024 * 1024 + 1))).toThrow("4 MB size limit");
  });
});
