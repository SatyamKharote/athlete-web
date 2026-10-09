import { useId, useRef, useState, type FormEvent } from 'react';
import { createAthlete, updateAthlete } from '../api/athletes';
import type { Athlete, AthleteInput } from '../api/types';
import { useToast } from '../hooks/useToast';
import {
  ATHLETE_LIMITS,
  hasErrors,
  mapServerErrors,
  validateAthlete,
  type AthleteField,
  type AthleteFormValues,
  type FieldErrors,
} from '../lib/validation';
import { Button } from './Button';
import { FormError, TextField } from './FormField';
import { Modal } from './Modal';

const FIELDS: readonly AthleteField[] = ['name', 'email', 'sport'];
const SPORT_SUGGESTIONS = ['Cricket', 'Athletics', 'Football', 'Swimming', 'Tennis', 'Rugby', 'Basketball', 'Cycling'];

interface AthleteFormModalProps {
  open: boolean;
  /** Pass an athlete to edit; omit to create. */
  athlete?: Athlete | null;
  onClose: () => void;
  onSaved: (athlete: Athlete) => void;
}

export function AthleteFormModal({ open, athlete, onClose, onSaved }: AthleteFormModalProps) {
  const formId = useId();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(athlete);

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title={isEdit ? 'Edit athlete' : 'Add athlete'}
      description={isEdit ? 'Update this athlete’s profile details.' : 'Create a profile to start logging training sessions.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add athlete'}
          </Button>
        </>
      }
    >
      <AthleteForm formId={formId} athlete={athlete ?? null} onSavingChange={setSaving} onSaved={onSaved} />
    </Modal>
  );
}

interface AthleteFormProps {
  formId: string;
  athlete: Athlete | null;
  onSavingChange: (saving: boolean) => void;
  onSaved: (athlete: Athlete) => void;
}

function AthleteForm({ formId, athlete, onSavingChange, onSaved }: AthleteFormProps) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<AthleteFormValues>({
    name: athlete?.name ?? '',
    email: athlete?.email ?? '',
    sport: athlete?.sport ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors<AthleteField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: AthleteField, value: string) {
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

    const clientErrors = validateAthlete(values);
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      focusFirstInvalid();
      return;
    }

    const trimmed: AthleteInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      sport: values.sport.trim(),
    };

    // PATCH only the fields that actually changed.
    let changes: Partial<AthleteInput> | null = null;
    if (athlete) {
      changes = {};
      for (const field of FIELDS) {
        if (trimmed[field] !== athlete[field]) changes[field] = trimmed[field];
      }
      if (Object.keys(changes).length === 0) {
        toast.info('No changes to save.');
        onSaved(athlete);
        return;
      }
    }

    setSubmitting(true);
    onSavingChange(true);
    try {
      const saved = athlete && changes ? await updateAthlete(athlete.id, changes) : await createAthlete(trimmed);
      toast.success(athlete ? `Saved changes to ${saved.name}.` : `${saved.name} added.`);
      onSavingChange(false);
      onSaved(saved);
    } catch (err) {
      const mapped = mapServerErrors(err, FIELDS, {
        conflictField: 'email',
        conflictMessage: 'An athlete with this email already exists.',
      });
      setErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      setSubmitting(false);
      onSavingChange(false);
      focusFirstInvalid();
    }
  }

  const sportListId = `${formId}-sports`;

  return (
    <form id={formId} ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />
      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        required
        maxLength={ATHLETE_LIMITS.nameMax + 20}
        placeholder="e.g. Priya Sharma"
        value={values.name}
        onChange={(e) => update('name', e.target.value)}
        error={errors.name}
        disabled={submitting}
        data-autofocus
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="name@example.com"
        value={values.email}
        onChange={(e) => update('email', e.target.value)}
        error={errors.email}
        disabled={submitting}
      />
      <TextField
        label="Sport"
        name="sport"
        required
        list={sportListId}
        placeholder="e.g. Cricket"
        value={values.sport}
        onChange={(e) => update('sport', e.target.value)}
        error={errors.sport}
        disabled={submitting}
      />
      <datalist id={sportListId}>
        {SPORT_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </form>
  );
}
