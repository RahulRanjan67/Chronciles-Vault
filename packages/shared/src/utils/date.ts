/**
 * ISO 8601 date-time string utilities.
 *
 * All timestamps in Chronicles Vault are stored as ISO 8601 strings
 * (e.g. "2024-03-15T10:30:00.000Z") so that they survive JSON serialisation,
 * SQLite TEXT columns, and cross-platform boundary crossings without any
 * date-object magic.
 */

/** A string that is expected to conform to ISO 8601 (no runtime validation). */
export type ISODateString = string;

/** Return the current moment as an ISO 8601 UTC string. */
export function nowISO(): ISODateString {
  return new Date().toISOString();
}

/**
 * Convert a Date object to an ISO 8601 string.
 *
 * @param date - Any valid JS Date
 * @returns ISO 8601 string representation
 */
export function toISO(date: Date): ISODateString {
  return date.toISOString();
}

/**
 * Parse an ISO 8601 string into a JS Date.
 *
 * @throws {RangeError} When the string is not parseable as a valid date.
 */
export function fromISO(iso: ISODateString): Date {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    throw new RangeError(`Invalid ISO date string: "${iso}"`);
  }
  return d;
}

/**
 * Compute the difference in whole days between two ISO date strings.
 * Positive if `a` is later than `b`.
 */
export function daysBetweenISO(a: ISODateString, b: ISODateString): number {
  const msPerDay = 86_400_000;
  return Math.floor((fromISO(a).getTime() - fromISO(b).getTime()) / msPerDay);
}

/**
 * Return the ISO string for `n` days before the given reference date
 * (defaults to now).
 */
export function daysAgoISO(n: number, from: Date = new Date()): ISODateString {
  return new Date(from.getTime() - n * 86_400_000).toISOString();
}

/** Compare two ISO strings chronologically.  Suitable for Array.sort(). */
export function compareISO(a: ISODateString, b: ISODateString): number {
  return fromISO(a).getTime() - fromISO(b).getTime();
}

/** Return true if the ISO string represents a date in the past relative to now. */
export function isPastISO(iso: ISODateString): boolean {
  return fromISO(iso).getTime() < Date.now();
}

/** Format an ISO string as "YYYY-MM-DD" (date only, UTC). */
export function toDatePart(iso: ISODateString): string {
  return iso.slice(0, 10);
}
