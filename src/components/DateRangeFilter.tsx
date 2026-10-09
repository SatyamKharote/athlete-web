import { CalendarRange, X } from 'lucide-react';
import { useMemo } from 'react';
import type { DateRange } from '../api/types';
import { getRangePresets } from '../lib/dates';
import { cn } from '../lib/format';
import { controlClass } from './FormField';

interface DateRangeFilterProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  error?: string | null;
}

export function DateRangeFilter({ range, onChange, error }: DateRangeFilterProps) {
  const presets = useMemo(() => getRangePresets(), []);
  const activePreset = presets.find((p) => (p.from ?? '') === (range.from ?? '') && (p.to ?? '') === (range.to ?? ''));
  const hasRange = Boolean(range.from || range.to);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div role="group" aria-label="Quick date ranges" className="inline-flex w-full rounded-xl border border-line bg-surface p-1 sm:w-auto">
        {presets.map((preset) => {
          const active = activePreset?.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ from: preset.from, to: preset.to })}
              className={cn(
                'flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 sm:flex-none',
                active ? 'bg-surface-3 text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="sr-only">Custom date range</legend>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="hidden size-4 text-muted sm:block" aria-hidden />
          <label className="flex flex-1 items-center gap-2 sm:flex-none">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">From</span>
            <input
              type="date"
              value={range.from ?? ''}
              max={range.to || undefined}
              onChange={(e) => onChange({ ...range, from: e.target.value || undefined })}
              aria-invalid={error ? true : undefined}
              className={cn(controlClass, 'h-9 min-w-0 flex-1 border-line px-2.5 tabular-nums sm:w-40 sm:flex-none')}
            />
          </label>
          <label className="flex flex-1 items-center gap-2 sm:flex-none">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">To</span>
            <input
              type="date"
              value={range.to ?? ''}
              min={range.from || undefined}
              onChange={(e) => onChange({ ...range, to: e.target.value || undefined })}
              aria-invalid={error ? true : undefined}
              className={cn(controlClass, 'h-9 min-w-0 flex-1 border-line px-2.5 tabular-nums sm:w-40 sm:flex-none')}
            />
          </label>
          {hasRange && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
              Clear
            </button>
          )}
        </div>
        {error && (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </div>
  );
}
