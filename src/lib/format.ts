import { parseISODate } from './dates';

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percentFormat = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
});
const signedFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
});
const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const shortDateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatCompact(value: number): string {
  return compactFormat.format(value);
}

export function formatSigned(value: number): string {
  return signedFormat.format(value);
}

/** `ratio` is a fraction: 0.3 → "+30%". */
export function formatPercent(ratio: number): string {
  return percentFormat.format(ratio);
}

/** Formats a "YYYY-MM-DD" calendar date, e.g. "29 Sep 2026". */
export function formatDate(value: string): string {
  const date = parseISODate(value);
  return date ? dateFormat.format(date) : value;
}

/** Formats a "YYYY-MM-DD" calendar date without the year, e.g. "29 Sep". */
export function formatShortDate(value: string): string {
  const date = parseISODate(value);
  return date ? shortDateFormat.format(date) : value;
}

/** Formats an ISO timestamp as a calendar date. */
export function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Tiny className joiner. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
