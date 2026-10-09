export interface Athlete {
  id: string;
  name: string;
  email: string;
  sport: string;
  /** ISO timestamp */
  createdAt: string;
}

export const SESSION_TYPES = [
  'Batting',
  'Bowling',
  'Fielding',
  'Strength',
  'Sprint',
  'Recovery',
] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export interface Session {
  id: string;
  athleteId: string;
  /** "YYYY-MM-DD" */
  sessionDate: string;
  type: SessionType;
  durationMin: number;
  rpe: number;
  notes: string | null;
  createdAt: string;
  /** durationMin × rpe */
  trainingLoad: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface WeeklyLoad {
  /** "YYYY-MM-DD", always a Monday */
  weekStart: string;
  sessions: number;
  totalMinutes: number;
  weeklyLoad: number;
  /** Absolute load difference from the previous week; null for the first week. */
  changeFromLastWeek: number | null;
}

export interface ApiErrorBody {
  message: string | string[];
  error: string;
  statusCode: number;
}

export interface AthleteInput {
  name: string;
  email: string;
  sport: string;
}

export interface SessionInput {
  sessionDate: string;
  type: SessionType;
  durationMin: number;
  rpe: number;
  notes?: string;
}

export interface DateRange {
  from?: string;
  to?: string;
}
