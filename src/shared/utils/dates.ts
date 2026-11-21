/**
 * Date helpers that work on the device's LOCAL calendar day.
 * A "date key" is a local calendar date string `YYYY-MM-DD` (no time, no timezone).
 */

export type DateKey = string;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local calendar date of `date` as `YYYY-MM-DD`. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isDateKey(value: string): boolean {
  const match = DATE_KEY_RE.exec(value);
  if (!match) {
    return false;
  }
  const date = fromDateKey(value);
  return toDateKey(date) === value;
}

/** Local midnight of the given date key. */
export function fromDateKey(key: DateKey): Date {
  const match = DATE_KEY_RE.exec(key);
  if (!match) {
    throw new Error(`Invalid date key: ${key}`);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Adds whole calendar days (safe across DST changes because it works on calendar fields). */
export function addDays(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DateKey, to: DateKey): number {
  const a = fromDateKey(from);
  const b = fromDateKey(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

/** Milliseconds until the next local midnight after `now`. */
export function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
