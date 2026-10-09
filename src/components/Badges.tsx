import { CircleDot, Dumbbell, Hand, HeartPulse, Target, Zap, type LucideIcon } from 'lucide-react';
import type { SessionType } from '../api/types';
import { cn, initials } from '../lib/format';
import { rpeLevel } from '../lib/training';

export function SportBadge({ sport, className }: { sport: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-fg/85 uppercase',
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
      <span className="truncate">{sport}</span>
    </span>
  );
}

const sessionIcons: Record<SessionType, LucideIcon> = {
  Batting: Target,
  Bowling: CircleDot,
  Fielding: Hand,
  Strength: Dumbbell,
  Sprint: Zap,
  Recovery: HeartPulse,
};

export function SessionTypeBadge({ type }: { type: SessionType }) {
  const Icon = sessionIcons[type] ?? CircleDot;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-1 text-[13px] font-medium text-fg">
      <Icon className="size-3.5 text-muted" aria-hidden />
      {type}
    </span>
  );
}

export function RpeIndicator({ rpe }: { rpe: number }) {
  const level = rpeLevel(rpe);
  return (
    <span className="inline-flex items-center gap-2" title={`RPE ${rpe} — ${level.label}`}>
      <span className="flex items-end gap-px" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="w-1 rounded-full"
            style={{
              height: 4 + i * 2.5,
              background: rpe > i * 2 ? level.color : 'var(--color-surface-3)',
            }}
          />
        ))}
      </span>
      <span className="font-medium text-fg tabular-nums">{rpe}</span>
      <span className="sr-only">out of 10, {level.label}</span>
    </span>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-gradient-to-br from-surface-3 to-surface-2 font-semibold text-fg',
        size === 'lg' ? 'size-16 text-xl sm:size-20 sm:text-2xl' : 'size-9 text-[13px]',
      )}
    >
      {initials(name)}
    </span>
  );
}
