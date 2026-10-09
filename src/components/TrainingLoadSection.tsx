import { BarChart3, Plus, Table2, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { getTrainingLoad } from '../api/sessions';
import type { DateRange } from '../api/types';
import { useQuery } from '../hooks/useQuery';
import { cn, formatDate, formatDuration, formatNumber, pluralize } from '../lib/format';
import { summarize, toWeekPoints } from '../lib/training';
import { Button } from './Button';
import { Card, EmptyState, ErrorState, Eyebrow, LoadingLabel, Skeleton } from './States';
import { TrainingLoadChart, TrainingLoadTable } from './TrainingLoadChart';

interface TrainingLoadSectionProps {
  athleteId: string;
  range: DateRange;
  /** Bump to force a refetch after sessions change. */
  refreshKey: number;
  onLogSession: () => void;
}

export function TrainingLoadSection({ athleteId, range, refreshKey, onLogSession }: TrainingLoadSectionProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const query = useQuery(
    `load:${athleteId}:${range.from ?? ''}:${range.to ?? ''}:${refreshKey}`,
    (signal) => getTrainingLoad(athleteId, range, signal),
  );

  const points = useMemo(() => toWeekPoints(query.data ?? []), [query.data]);
  const summary = useMemo(() => summarize(points), [points]);

  let body: ReactNode;
  if (query.error && !query.isFetching) {
    body = (
      <Card>
        <ErrorState title="Couldn’t load training load" error={query.error} onRetry={query.reload} />
      </Card>
    );
  } else if (query.isLoading) {
    body = <TrainingLoadSkeleton />;
  } else if (points.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon={<BarChart3 className="size-5" aria-hidden />}
          title="No training in this range"
          description="Log a session or widen the date range to see weekly load."
          action={
            <Button variant="primary" onClick={onLogSession} icon={<Plus className="size-4" aria-hidden />}>
              Log session
            </Button>
          }
        />
      </Card>
    );
  } else {
    body = (
      <div className={cn('flex flex-col gap-4 transition-opacity duration-200', query.isFetching && 'opacity-60')}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Total load" value={formatNumber(summary.totalLoad)} unit="AU" accent />
          <Kpi
            label="Avg weekly load"
            value={formatNumber(summary.averageWeeklyLoad)}
            unit="AU"
            sub={`across ${pluralize(points.length, 'week')}`}
          />
          <Kpi
            label="Total sessions"
            value={formatNumber(summary.totalSessions)}
            sub={formatDuration(summary.totalMinutes) + ' trained'}
          />
          <Kpi
            label="Peak week"
            value={summary.peakWeek ? formatNumber(summary.peakWeek.weeklyLoad) : '—'}
            unit="AU"
            sub={summary.peakWeek ? `w/c ${formatDate(summary.peakWeek.weekStart)}` : undefined}
          />
        </div>

        <Card className="p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-fg">Weekly load</h3>
              <p className="mt-0.5 text-[13px] text-muted">Sum of duration × RPE per week (Mon–Sun)</p>
            </div>
            <div role="group" aria-label="Display as" className="inline-flex self-start rounded-lg border border-line bg-surface-2 p-0.5">
              <ViewToggle active={view === 'chart'} onClick={() => setView('chart')} icon={<BarChart3 className="size-3.5" aria-hidden />}>
                Chart
              </ViewToggle>
              <ViewToggle active={view === 'table'} onClick={() => setView('table')} icon={<Table2 className="size-3.5" aria-hidden />}>
                Table
              </ViewToggle>
            </div>
          </div>

          {view === 'chart' ? (
            <div
              role="img"
              aria-label={`Bar chart of weekly training load over ${pluralize(points.length, 'week')}. Peak ${formatNumber(
                summary.peakWeek?.weeklyLoad ?? 0,
              )} in the week of ${summary.peakWeek ? formatDate(summary.peakWeek.weekStart) : '—'}. ${pluralize(
                summary.spikeCount,
                'spike week',
              )}. Switch to table view for exact values.`}
            >
              <TrainingLoadChart points={points} averageWeeklyLoad={summary.averageWeeklyLoad} />
            </div>
          ) : (
            <TrainingLoadTable points={points} />
          )}

          <SpikeLegend spikeCount={summary.spikeCount} />
        </Card>
      </div>
    );
  }

  return (
    <section aria-labelledby="training-load-heading" aria-busy={query.isFetching} className="flex flex-col gap-4">
      <h2 id="training-load-heading" className="sr-only">
        Training load
      </h2>
      {query.isFetching && <LoadingLabel>Loading training load</LoadingLabel>}
      {body}
    </section>
  );
}

function Kpi({ label, value, unit, sub, accent }: { label: string; value: string; unit?: string; sub?: string; accent?: boolean }) {
  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      {accent && <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent/0 via-accent/70 to-accent/0" aria-hidden />}
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-2 flex items-baseline gap-1 tabular-nums">
        <span className={cn('text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-9', accent ? 'text-accent' : 'text-fg')}>
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-muted">{unit}</span>}
      </p>
      {sub && <p className="mt-1 truncate text-[12px] text-subtle tabular-nums">{sub}</p>}
    </Card>
  );
}

function ViewToggle({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
        active ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function SpikeLegend({ spikeCount }: { spikeCount: number }) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 text-[13px] sm:flex-row sm:items-start sm:gap-6">
      <ul className="flex shrink-0 items-center gap-4 text-muted" aria-label="Legend">
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-accent" aria-hidden />
          Weekly load
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-warn" aria-hidden />
          Spike (&gt;30%)
        </li>
      </ul>
      <p className="flex gap-2 text-subtle">
        <TriangleAlert className={cn('mt-0.5 size-4 shrink-0', spikeCount > 0 ? 'text-warn' : 'text-subtle')} aria-hidden />
        <span>
          {spikeCount > 0 && (
            <span className="font-medium text-warn">{pluralize(spikeCount, 'spike week')} in this range. </span>
          )}
          Sudden spikes in training load — more than 30% above the previous week — are associated with a higher
          risk of injury. Build load gradually.
        </span>
      </p>
    </div>
  );
}

function TrainingLoadSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="p-4 sm:p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>
      <Card className="p-4 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-56" />
        <div className="mt-6 flex h-56 items-end gap-2 sm:h-72 sm:gap-3">
          {[45, 70, 60, 85, 50, 75, 90, 55, 65, 40, 80, 60].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
          ))}
        </div>
      </Card>
    </div>
  );
}
