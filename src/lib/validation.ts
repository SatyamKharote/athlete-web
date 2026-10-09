import { ApiError } from '../api/client';
import { SESSION_TYPES } from '../api/types';
import { isValidISODate } from './dates';

/** Mirrors the backend DTO rules so most mistakes are caught before a round-trip. */

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const ATHLETE_LIMITS = { nameMax: 100 } as const;
export const SESSION_LIMITS = {
  durationMin: 1,
  durationMax: 600,
  rpeMin: 1,
  rpeMax: 10,
  notesMax: 500,
} as const;

export type AthleteField = 'name' | 'email' | 'sport';

export interface AthleteFormValues {
  name: string;
  email: string;
  sport: string;
}

export function validateAthlete(values: AthleteFormValues): FieldErrors<AthleteField> {
  const errors: FieldErrors<AthleteField> = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Name is required.';
  else if (name.length > ATHLETE_LIMITS.nameMax)
    errors.name = `Name must be ${ATHLETE_LIMITS.nameMax} characters or fewer.`;

  const email = values.email.trim();
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';

  if (!values.sport.trim()) errors.sport = 'Sport is required.';
  return errors;
}

export type SessionField = 'sessionDate' | 'type' | 'durationMin' | 'rpe' | 'notes';

export interface SessionFormValues {
  sessionDate: string;
  type: string;
  durationMin: string;
  rpe: number;
  notes: string;
}

export function validateSession(values: SessionFormValues): FieldErrors<SessionField> {
  const errors: FieldErrors<SessionField> = {};
  if (!values.sessionDate) errors.sessionDate = 'Date is required.';
  else if (!isValidISODate(values.sessionDate)) errors.sessionDate = 'Enter a valid date.';

  if (!(SESSION_TYPES as readonly string[]).includes(values.type))
    errors.type = 'Choose a session type.';

  const raw = values.durationMin.trim();
  const duration = Number(raw);
  if (!raw) errors.durationMin = 'Duration is required.';
  else if (!Number.isInteger(duration)) errors.durationMin = 'Duration must be a whole number of minutes.';
  else if (duration < SESSION_LIMITS.durationMin || duration > SESSION_LIMITS.durationMax)
    errors.durationMin = `Duration must be between ${SESSION_LIMITS.durationMin} and ${SESSION_LIMITS.durationMax} minutes.`;

  if (
    !Number.isInteger(values.rpe) ||
    values.rpe < SESSION_LIMITS.rpeMin ||
    values.rpe > SESSION_LIMITS.rpeMax
  )
    errors.rpe = 'RPE must be between 1 and 10.';

  if (values.notes.length > SESSION_LIMITS.notesMax)
    errors.notes = `Notes must be ${SESSION_LIMITS.notesMax} characters or fewer.`;
  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * Maps a server error onto form fields. class-validator messages start with the
 * property name ("email must be an email"), so we match on that prefix; anything
 * we can't attribute to a field is returned as a form-level message.
 */
export function mapServerErrors<K extends string>(
  err: unknown,
  fields: readonly K[],
  overrides: {
    conflictField?: K;
    conflictMessage?: string;
    /** Human labels used in place of raw property names in server messages. */
    labels?: Partial<Record<K, string>>;
  } = {},
): { fieldErrors: FieldErrors<K>; formError: string | null } {
  const fieldErrors: FieldErrors<K> = {};
  if (!(err instanceof ApiError)) {
    return { fieldErrors, formError: err instanceof Error ? err.message : 'Something went wrong.' };
  }

  if (err.status === 409 && overrides.conflictField) {
    fieldErrors[overrides.conflictField] =
      overrides.conflictMessage ?? err.messages[0] ?? 'This value is already in use.';
    return { fieldErrors, formError: null };
  }

  const unmatched: string[] = [];
  if (err.status === 400) {
    for (const message of err.messages) {
      const field = fields.find((f) => message.toLowerCase().startsWith(f.toLowerCase()));
      if (field) {
        const rest = message.slice(field.length);
        const pretty = `${overrides.labels?.[field] ?? field.charAt(0).toUpperCase() + field.slice(1)}${rest}`;
        fieldErrors[field] = fieldErrors[field] ? `${fieldErrors[field]} ${pretty}` : pretty;
      } else {
        unmatched.push(message);
      }
    }
  } else {
    unmatched.push(...err.messages);
  }

  return { fieldErrors, formError: unmatched.length ? unmatched.join(' ') : null };
}
