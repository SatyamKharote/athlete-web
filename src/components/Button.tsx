import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid';
type Size = 'sm' | 'md';

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink hover:bg-accent-strong shadow-[0_0_0_1px_rgb(198_244_50/0.2),0_6px_20px_-8px_rgb(198_244_50/0.5)]',
  secondary:
    'border border-line bg-surface-2 text-fg hover:border-line-strong hover:bg-surface-3',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:border-danger/50 hover:bg-danger/20',
  'danger-solid': 'bg-danger text-white hover:bg-danger/90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — icon buttons have no visible text. */
  label: string;
  tone?: 'default' | 'danger';
  children: ReactNode;
}

export function IconButton({
  label,
  tone = 'default',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        tone === 'danger' ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-surface-3 hover:text-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
