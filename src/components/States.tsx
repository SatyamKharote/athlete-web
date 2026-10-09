import { AlertTriangle, RotateCw } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { getErrorMessage } from '../api/client';
import { cn } from '../lib/format';
import { Button } from './Button';

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden style={style} className={cn('animate-shimmer rounded-md bg-surface-3', className)} />;
}

/** Screen-reader announcement for a loading region. */
export function LoadingLabel({ children }: { children: string }) {
  return (
    <span role="status" className="sr-only">
      {children}
    </span>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-muted">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', error, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-danger/25 bg-danger/10 text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button className="mt-5" onClick={onRetry} icon={<RotateCw className="size-4" aria-hidden />}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-line bg-surface', className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('text-[11px] font-semibold tracking-[0.14em] text-muted uppercase', className)}>
      {children}
    </span>
  );
}
