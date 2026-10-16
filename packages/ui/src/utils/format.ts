/**
 * Date and text formatting utilities for Chronicles Vault.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Returns a relative human-readable time string.
 * e.g. "just now", "3 hours ago", "91 days ago", "2 years ago"
 */
export function relativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();

  if (diff < 30 * SECOND) return 'just now';
  if (diff < MINUTE) return `${Math.floor(diff / SECOND)}s ago`;
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)} days ago`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)} weeks ago`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)} months ago`;
  return `${Math.floor(diff / YEAR)} years ago`;
}

/**
 * Returns a relative time string using a past tense tone.
 * "91 days ago" vs "in 3 days"
 */
export function relativeDateRange(date: Date | string | number): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = d.getTime() - now;

  if (Math.abs(diff) < 30 * SECOND) return 'today';

  if (diff < 0) {
    // Past
    const abs = Math.abs(diff);
    if (abs < DAY) return 'today';
    if (abs < WEEK) return `${Math.floor(abs / DAY)} days ago`;
    if (abs < MONTH) return `${Math.floor(abs / WEEK)} weeks ago`;
    if (abs < YEAR) return `${Math.floor(abs / MONTH)} months ago`;
    return `${Math.floor(abs / YEAR)} years ago`;
  } else {
    // Future
    if (diff < DAY) return 'today';
    if (diff < WEEK) return `in ${Math.floor(diff / DAY)} days`;
    if (diff < MONTH) return `in ${Math.floor(diff / WEEK)} weeks`;
    if (diff < YEAR) return `in ${Math.floor(diff / MONTH)} months`;
    return `in ${Math.floor(diff / YEAR)} years`;
  }
}

/**
 * Formats a Date to a short display string: "Oct 4, 2026"
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a Date to a compact display string: "Oct 4"
 */
export function formatDateShort(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats seconds to a duration string: "1h 23m" or "14:32"
 */
export function formatDuration(seconds: number, style: 'long' | 'clock' = 'long'): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (style === 'clock') {
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/**
 * Formats a number with locale thousands separators: 1234 → "1,234"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Clamps text to a max character length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * Pluralizes a word: "1 chapter", "3 chapters"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const p = plural ?? `${singular}s`;
  return `${formatNumber(count)} ${count === 1 ? singular : p}`;
}
