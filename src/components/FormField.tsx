import { ChevronDown } from 'lucide-react';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../lib/format';

export const controlClass =
  'w-full rounded-xl border bg-surface-2 px-3.5 text-sm text-fg placeholder:text-subtle ' +
  'transition-[border-color,box-shadow,background-color] duration-150 ' +
  'hover:border-line-strong focus:outline-none focus-visible:outline-none ' +
  'focus:border-accent/70 focus:ring-3 focus:ring-accent/15 disabled:opacity-60';

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Right-aligned extra, e.g. a character counter. */
  aside?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ id, label, error, hint, aside, required, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
          {label}
          {required && (
            <span className="ml-0.5 text-accent" aria-hidden>
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  aside?: ReactNode;
  containerClassName?: string;
}

export function TextField({ label, error, hint, aside, required, className, containerClassName, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} aside={aside} required={required} className={containerClassName}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClass, 'h-11', error ? 'border-danger/60' : 'border-line', className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  containerClassName?: string;
  children: ReactNode;
}

export function SelectField({ label, error, hint, required, className, containerClassName, children, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(
            controlClass,
            'h-11 cursor-pointer appearance-none pr-10',
            error ? 'border-danger/60' : 'border-line',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </FieldShell>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  aside?: ReactNode;
  containerClassName?: string;
}

export function TextAreaField({ label, error, hint, aside, required, className, containerClassName, ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} aside={aside} required={required} className={containerClassName}>
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClass, 'min-h-24 resize-y py-2.5', error ? 'border-danger/60' : 'border-line', className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
      {message}
    </div>
  );
}
