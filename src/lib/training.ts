import type { WeeklyLoad } from '../api/types';

/** A week-over-week rise above this ratio is flagged as a spike. */
export const SPIKE_THRESHOLD = 0.3;

export interface RpeLevel {
  label: string;
  /** CSS colour used for the slider and badges. */
  color: string;
}

const RPE_LABELS: Record<number, string> = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Somewhat hard',
  5: 'Hard',
  6: 'Hard',
  7: 'Very hard',
  8: 'Very hard',
  9: 'Extremely hard',
  10: 'Max effort',
};

export function rpeLevel(rpe: number): RpeLevel {
  const label = RPE_LABELS[rpe] ?? '';
  let color = 'var(--color-accent)';
  if (rpe <= 3) color = 'var(--color-success)';
  else if (rpe >= 9) color = 'var(--color-danger)';
  else if (rpe >= 7) color = 'var(--color-warn)';
  return { label, color };
}

export interface WeekPoint extends WeeklyLoad {
  /** Week-over-week change as a ratio of the previous week's load, when computable. */
  changeRatio: number | null;
  isSpike: boolean;
}

/**
 * The API's `changeFromLastWeek` is an absolute difference, so the previous
 * week's load is `weeklyLoad - changeFromLastWeek`.
 */
export function toWeekPoints(weeks: WeeklyLoad[]): WeekPoint[] {
  return weeks.map((week) => {
    const change = week.changeFromLastWeek;
    let changeRatio: number | null = null;
    if (change !== null) {
      const previous = week.weeklyLoad - change;
      if (previous > 0) changeRatio = change / previous;
    }
    return {
      ...week,
      changeRatio,
      isSpike: changeRatio !== null && changeRatio > SPIKE_THRESHOLD,
    };
  });
}

export interface LoadSummary {
  totalLoad: number;
  averageWeeklyLoad: number;
  totalSessions: number;
  totalMinutes: number;
  peakWeek: WeekPoint | null;
  spikeCount: number;
}

export function summarize(points: WeekPoint[]): LoadSummary {
  let totalLoad = 0;
  let totalSessions = 0;
  let totalMinutes = 0;
  let spikeCount = 0;
  let peakWeek: WeekPoint | null = null;
  for (const point of points) {
    totalLoad += point.weeklyLoad;
    totalSessions += point.sessions;
    totalMinutes += point.totalMinutes;
    if (point.isSpike) spikeCount += 1;
    if (!peakWeek || point.weeklyLoad > peakWeek.weeklyLoad) peakWeek = point;
  }
  return {
    totalLoad,
    averageWeeklyLoad: points.length ? Math.round(totalLoad / points.length) : 0,
    totalSessions,
    totalMinutes,
    peakWeek,
    spikeCount,
  };
}
