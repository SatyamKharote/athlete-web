/** Date helpers that treat "YYYY-MM-DD" strings as local calendar dates (no timezone drift). */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  // Reject overflow such as 2026-02-31.
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const day = (date.getDay() + 6) % 7; // Monday = 0
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -day);
}

export type RangePresetId = 'last4' | 'last12' | 'all';

export interface RangePreset {
  id: RangePresetId;
  label: string;
  from?: string;
  to?: string;
}

/** Presets cover whole weeks so the first bar in the chart is a complete week. */
export function getRangePresets(now: Date = new Date()): RangePreset[] {
  const today = toISODate(now);
  const thisMonday = startOfWeek(now);
  return [
    { id: 'last4', label: 'Last 4 weeks', from: toISODate(addDays(thisMonday, -7 * 3)), to: today },
    { id: 'last12', label: 'Last 12 weeks', from: toISODate(addDays(thisMonday, -7 * 11)), to: today },
    { id: 'all', label: 'All' },
  ];
}
