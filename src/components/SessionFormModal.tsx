import { useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { createSession, updateSession } from '../api/sessions';
import { SESSION_TYPES, type Session, type SessionInput, type SessionType } from '../api/types';
import { useToast } from '../hooks/useToast';
import { todayISO } from '../lib/dates';
import { cn, formatDate, formatNumber } from '../lib/format';
import { rpeLevel } from '../lib/training';
import {
  SESSION_LIMITS,
  hasErrors,
  mapServerErrors,
  validateSession,
  type FieldErrors,
  type SessionField,
  type SessionFormValues,
} from '../lib/validation';
import { Button } from './Button';
import { FieldShell, FormError, SelectField, TextAreaField, TextField } from './FormField';
import { Modal } from './Modal';

const FIELDS: readonly SessionField[] = ['sessionDate', 'type', 'durationMin', 'rpe', 'notes'];
const FIELD_LABELS: Partial<Record<SessionField, string>> = {
  sessionDate: 'Date',
  type: 'Type',
  durationMin: 'Duration',
  rpe: 'RPE',
  notes: 'Notes',
};

interface SessionFormModalProps {
  open: boolean;
  athleteId: string;
  /** Pass a session to edit; omit to log a new one. */
  session?: Session | null;
  onClose: () => void;
  onSaved: (session: Session) => void;
}

export function SessionFormModal({ open, athleteId, session, onClose, onSaved }: SessionFormModalProps) {
  const formId = useId();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(session);

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={isEdit ? 'Edit session' : 'Log session'}
      description={
        isEdit && session
          ? `${session.type} on ${formatDate(session.sessionDate)}`
          : 'Record a training session. Load is calculated as duration × RPE.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log session'}
          </Button>
        </>
      }
    >
      <SessionForm
        formId={formId}
        athleteId={athleteId}
        session={session ?? null}
        onSavingChange={setSaving}
        onSaved={onSaved}
      />
    </Modal>
  );
}

interface SessionFormProps {
  formId: string;
  athleteId: string;
  session: Session | null;
  onSavingChange: (saving: boolean) => void;
  onSaved: (session: Session) => void;
}

function SessionForm({ formId, athleteId, session, onSavingChange, onSaved }: SessionFormProps) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<SessionFormValues>({
    sessionDate: session?.sessionDate ?? todayISO(),
    type: session?.type ?? '',
    durationMin: session ? String(session.durationMin) : '',
    rpe: session?.rpe ?? 5,
    notes: session?.notes ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors<SessionField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends SessionField>(field: K, value: SessionFormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const clientErrors = validateSession(values);
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      focusFirstInvalid();
      return;
    }

    const input: SessionInput = {
      sessionDate: values.sessionDate,
      type: values.type as SessionType,
      durationMin: Number(values.durationMin),
      rpe: values.rpe,
    };
    const notes = values.notes.trim();
    if (notes) input.notes = notes;

    let changes: Partial<SessionInput> | null = null;
    if (session) {
      changes = {};
      if (input.sessionDate !== session.sessionDate) changes.sessionDate = input.sessionDate;
      if (input.type !== session.type) changes.type = input.type;
      if (input.durationMin !== session.durationMin) changes.durationMin = input.durationMin;
      if (input.rpe !== session.rpe) changes.rpe = input.rpe;
      if (notes !== (session.notes ?? '')) changes.notes = notes;
      if (Object.keys(changes).length === 0) {
        toast.info('No changes to save.');
        onSaved(session);
        return;
      }
    }

    setSubmitting(true);
    onSavingChange(true);
    try {
      const saved = session && changes ? await updateSession(session.id, changes) : await createSession(athleteId, input);
      toast.success(session ? 'Session updated.' : `${saved.type} session logged.`);
      onSavingChange(false);
      onSaved(saved);
    } catch (err) {
      const mapped = mapServerErrors(err, FIELDS, { labels: FIELD_LABELS });
      setErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      setSubmitting(false);
      onSavingChange(false);
      focusFirstInvalid();
    }
  }

  const duration = Number(values.durationMin);
  const durationValid =
    Number.isInteger(duration) && duration >= SESSION_LIMITS.durationMin && duration <= SESSION_LIMITS.durationMax;
  const previewLoad = durationValid ? duration * values.rpe : null;
  const rpeId = useId();
  const level = rpeLevel(values.rpe);
  const rpeFill = ((values.rpe - 1) / 9) * 100;

  return (
    <form id={formId} ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormError message={formError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Date"
          type="date"
          required
          value={values.sessionDate}
          onChange={(e) => update('sessionDate', e.target.value)}
          error={errors.sessionDate}
          disabled={submitting}
          data-autofocus
        />
        <SelectField
          label="Type"
          required
          value={values.type}
          onChange={(e) => update('type', e.target.value)}
          error={errors.type}
          disabled={submitting}
        >
          <option value="" disabled>
            Select type…
          </option>
          {SESSION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField
        label="Duration (minutes)"
        type="number"
        inputMode="numeric"
        required
        min={SESSION_LIMITS.durationMin}
        max={SESSION_LIMITS.durationMax}
        step={1}
        placeholder="e.g. 60"
        value={values.durationMin}
        onChange={(e) => update('durationMin', e.target.value)}
        error={errors.durationMin}
        hint={`Between ${SESSION_LIMITS.durationMin} and ${SESSION_LIMITS.durationMax} minutes.`}
        disabled={submitting}
        className="tabular-nums"
      />

      <FieldShell
        id={rpeId}
        label="RPE · perceived exertion"
        error={errors.rpe}
        required
        aside={
          <span className="text-sm tabular-nums" aria-hidden>
            <span className="text-lg font-bold" style={{ color: level.color }}>
              {values.rpe}
            </span>
            <span className="text-muted"> / 10 · {level.label}</span>
          </span>
        }
      >
        <div className="pt-2">
          <input
            id={rpeId}
            type="range"
            className="range"
            min={SESSION_LIMITS.rpeMin}
            max={SESSION_LIMITS.rpeMax}
            step={1}
            value={values.rpe}
            onChange={(e) => update('rpe', Number(e.target.value))}
            aria-valuetext={`${values.rpe} out of 10, ${level.label}`}
            aria-invalid={errors.rpe ? true : undefined}
            disabled={submitting}
            style={
              {
                '--range-fill': `${rpeFill}%`,
                '--range-color': level.color,
              } as CSSProperties
            }
          />
          <div className="mt-2 flex justify-between px-[3px] text-[11px] text-subtle tabular-nums" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={cn('w-4 text-center', i + 1 === values.rpe && 'font-semibold text-fg')}>
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-subtle" aria-hidden>
            <span>Very easy</span>
            <span>Max effort</span>
          </div>
        </div>
      </FieldShell>

      <TextAreaField
        label="Notes"
        placeholder="Optional — how did it feel? Any niggles?"
        value={values.notes}
        onChange={(e) => update('notes', e.target.value)}
        error={errors.notes}
        disabled={submitting}
        aside={
          <span
            className={cn(
              'text-[11px] tabular-nums',
              values.notes.length > SESSION_LIMITS.notesMax ? 'text-danger' : 'text-subtle',
            )}
          >
            {values.notes.length}/{SESSION_LIMITS.notesMax}
          </span>
        }
      />

      <div
        className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface-2 px-4 py-3.5"
        aria-live="polite"
      >
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Training load</p>
          <p className="mt-0.5 text-[13px] text-subtle tabular-nums">
            {durationValid ? `${duration} min × RPE ${values.rpe}` : 'Duration × RPE'}
          </p>
        </div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {previewLoad !== null ? (
            <span className="text-accent">{formatNumber(previewLoad)}</span>
          ) : (
            <span className="text-subtle">—</span>
          )}
          <span className="ml-1 text-xs font-medium text-muted">AU</span>
        </p>
      </div>
    </form>
  );
}
