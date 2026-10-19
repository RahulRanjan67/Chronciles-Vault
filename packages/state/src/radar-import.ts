import { normalizeUrl } from "@grimoire/domain";

export type RadarBrowserSource = "chromium" | "firefox" | "edge" | "safari" | "unknown";

export interface RadarImportedItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl?: string;
  readonly browserSource: RadarBrowserSource;
  readonly windowId?: number;
  readonly tabId?: number;
  readonly capturedAt: string;
  readonly batchId: string;
  readonly batchLabel: string;
  readonly normalizedUrl: string;
}

export interface RadarImportBatch {
  readonly format: "grimoire-radar";
  readonly version: 1;
  readonly batchId: string;
  readonly batchLabel: string;
  readonly browserSource: RadarBrowserSource;
  readonly capturedAt: string;
  readonly items: readonly RadarImportedItem[];
}

const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
const MAX_BATCH_ITEMS = 100;
const BROWSERS = new Set<RadarBrowserSource>(["chromium", "firefox", "edge", "safari", "unknown"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(`Radar import has an invalid ${field}.`);
  }
  return value.trim();
}

function optionalNonNegativeInteger(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Radar import has an invalid ${field}.`);
  }
  return value;
}

function isTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

const SENSITIVE_PARAMETER =
  /(^|[-_])(access[-_]?token|api[-_]?key|auth|authorization|cookie|jwt|password|passwd|refresh[-_]?token|secret|session(id|key)?|sid|token)([-_]|$)/i;

export function sanitizeRadarCaptureUrl(rawUrl: string): { url: string; normalizedUrl: string } {
  const parsed = new URL(rawUrl);
  if (parsed.username || parsed.password) {
    throw new Error("Radar import cannot contain URLs with embedded credentials.");
  }
  for (const key of Array.from(parsed.searchParams.keys())) {
    const normalizedKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
    if (SENSITIVE_PARAMETER.test(normalizedKey)) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.hash = "";
  const url = parsed.toString();
  const normalized = normalizeUrl(url);
  if (!normalized.isValid) throw new Error("Radar import contains a non-HTTP(S) URL.");
  return { url: normalized.normalizedUrl, normalizedUrl: normalized.normalizedUrl };
}

export function parseRadarImport(json: string): RadarImportBatch {
  if (new TextEncoder().encode(json).byteLength > MAX_IMPORT_BYTES) {
    throw new Error("Radar import exceeds the 4 MB size limit.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(json) as unknown;
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (
    !isRecord(decoded) ||
    decoded["format"] !== "grimoire-radar" ||
    decoded["version"] !== 1
  ) {
    throw new Error("The selected file is not a supported Radar capture export.");
  }

  const batchId = requiredString(decoded["batchId"], "batch ID", 128);
  const batchLabel = requiredString(decoded["batchLabel"], "batch label", 200);
  const browserSource =
    typeof decoded["browserSource"] === "string" &&
    BROWSERS.has(decoded["browserSource"] as RadarBrowserSource)
      ? (decoded["browserSource"] as RadarBrowserSource)
      : "unknown";
  const capturedAt = requiredString(decoded["capturedAt"], "capture timestamp", 64);
  if (!isTimestamp(capturedAt)) throw new Error("Radar import has an invalid capture timestamp.");
  const rawItems = decoded["items"];
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_BATCH_ITEMS) {
    throw new Error(`Radar imports must contain between 1 and ${MAX_BATCH_ITEMS} items.`);
  }

  const seenUrls = new Map<string, number>();
  const items: RadarImportedItem[] = [];
  for (const candidate of rawItems) {
    if (!isRecord(candidate)) throw new Error("Radar import contains an invalid capture item.");

    const rawUrl = requiredString(candidate["url"], "capture URL", 4096);
    let safeUrl: { url: string; normalizedUrl: string };
    try {
      safeUrl = sanitizeRadarCaptureUrl(rawUrl);
    } catch (error) {
      if (error instanceof Error && error.message.includes("embedded credentials")) throw error;
      throw new Error("Radar import contains a non-HTTP(S) URL.");
    }
    const { url, normalizedUrl } = safeUrl;
    const itemBrowser =
      typeof candidate["browserSource"] === "string" &&
      BROWSERS.has(candidate["browserSource"] as RadarBrowserSource)
        ? (candidate["browserSource"] as RadarBrowserSource)
        : browserSource;
    const itemCapturedAt =
      typeof candidate["capturedAt"] === "string" && isTimestamp(candidate["capturedAt"])
        ? candidate["capturedAt"]
        : capturedAt;
    const captureTime = Date.parse(itemCapturedAt);
    const previousCaptureTime = seenUrls.get(normalizedUrl);
    if (
      previousCaptureTime !== undefined &&
      Math.abs(captureTime - previousCaptureTime) <= 24 * 60 * 60 * 1000
    ) {
      continue;
    }
    items.push({
      id: requiredString(candidate["id"], "capture ID", 128),
      url,
      title: requiredString(candidate["title"], "capture title", 500),
      browserSource: itemBrowser,
      ...(optionalNonNegativeInteger(candidate["windowId"], "window ID") !== undefined
        ? { windowId: optionalNonNegativeInteger(candidate["windowId"], "window ID") }
        : {}),
      ...(optionalNonNegativeInteger(candidate["tabId"], "tab ID") !== undefined
        ? { tabId: optionalNonNegativeInteger(candidate["tabId"], "tab ID") }
        : {}),
      capturedAt: itemCapturedAt,
      batchId,
      batchLabel,
      normalizedUrl,
    });
    seenUrls.set(normalizedUrl, captureTime);
  }

  if (items.length === 0) throw new Error("Radar import contains no usable capture URLs.");

  return {
    format: "grimoire-radar",
    version: 1,
    batchId,
    batchLabel,
    browserSource,
    capturedAt,
    items,
  };
}
