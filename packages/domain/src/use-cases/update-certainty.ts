import { UpdateCertainty, type UpdateEntry } from "../value-objects/update-entry.js";

const ISO_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

function parseTimestamp(value: string, label: string): number {
  const match = ISO_TIMESTAMP.exec(value);
  if (!match) throw new Error(`${label} must be a valid ISO 8601 timestamp`);
  const [, year, month, day, hour, minute, second, zone] = match;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));
  const zoneMatch = /^([+-])(\d{2}):(\d{2})$/.exec(zone);
  const validZone =
    zone === "Z" ||
    (zoneMatch !== null && Number(zoneMatch[2]) <= 23 && Number(zoneMatch[3]) <= 59);
  const timestamp = Date.parse(value);
  if (
    date.getUTCFullYear() !== yearNumber ||
    date.getUTCMonth() !== monthNumber - 1 ||
    date.getUTCDate() !== dayNumber ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    !validZone ||
    !Number.isFinite(timestamp)
  ) {
    throw new Error(`${label} must be a valid ISO 8601 timestamp`);
  }
  return timestamp;
}

/**
 * Marks an update stale once its last detected/verified timestamp reaches the
 * caller's validity window. The window is explicit because the contract does
 * not prescribe a global duration.
 */
export function applyUpdateCertaintyValidity(
  entry: UpdateEntry,
  evaluatedAt: string,
  validityWindowMs: number,
): UpdateEntry {
  if (!Number.isFinite(validityWindowMs) || validityWindowMs < 0) {
    throw new Error("validityWindowMs must be a non-negative finite number");
  }
  const detectedAt = parseTimestamp(entry.detectedAt, "detectedAt");
  const evaluationTime = parseTimestamp(evaluatedAt, "evaluatedAt");
  const isStale = evaluationTime - detectedAt >= validityWindowMs;
  if (!isStale || entry.certainty === UpdateCertainty.Stale) return entry;
  return { ...entry, certainty: UpdateCertainty.Stale };
}
