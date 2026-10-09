import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { listSessions } from '../api/sessions';
import type { DateRange, Session } from '../api/types';
import { useQuery } from '../hooks/useQuery';
import { cn, formatDate, formatNumber, pluralize } from '../lib/format';
import { RpeIndicator, SessionTypeBadge } from './Badges';
import { Button, IconButton } from './Button';
import { Pagination } from './Pagination';
import { Card, EmptyState, ErrorState, LoadingLabel, Skeleton } from './States';

const SESSIONS_PAGE_SIZE = 10;

interface SessionsSectionProps {
  athleteId: string;
  range: DateRange;
  page: number;
  onPageChange: (page: number, options?: { replace?: boolean }) => void;
  refreshKey: number;
  onAdd: () => void;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
}

export function SessionsSection({ athleteId, range, page, onPageChange, refreshKey, onAdd, onEdit, onDelete }: SessionsSectionProps) {
  const query = useQuery(
    `sessions:${athleteId}:${range.from ?? ''}:${range.to ?? ''}:${page}:${refreshKey}`,
    (signal) => listSessions(athleteId, { ...range, page, limit: SESSIONS_PAGE_SIZE }, signal),
  );
  const meta = query.data?.meta;

  // If the current page no longer exists (e.g. after deleting its last session), step back.
  useEffect(() => {
    if (!query.isFetching && meta && meta.totalPages > 0 && page > meta.totalPages) {
      onPageChange(meta.totalPages, { replace: true });
    }
  }, [query.isFetching, meta, page, onPageChange]);

  const sessions = query.data?.data ?? [];
  const filtered = Boolean(range.from || range.to);

  let body: ReactNode;
  if (query.error && !query.isFetching) {
    body = <ErrorState title="Couldn’t load sessions" error={query.error} onRetry={query.reload} />;
  } else if (query.isLoading) {
    body = <SessionsSkeleton />;
  } else if (sessions.length === 0) {
    body = (
      <EmptyState
        icon={<ClipboardList className="size-5" aria-hidden />}
        title={filtered ? 'No sessions in this range' : 'No sessions yet'}
        description={filtered ? 'Try a wider date range, or log a new session.' : 'Log the first training session to start tracking load.'}
        action={
          <Button variant="primary" onClick={onAdd} icon={<Plus className="size-4" aria-hidden />}>
            Log session
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className={cn('transition-opacity duration-200', query.isFetching && 'opacity-60')}>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <caption className="sr-only">Training sessions, newest first</caption>
            <thead>
              <tr className="border-b border-line text-left text-[11px] tracking-[0.12em] text-muted uppercase">
                <th scope="col" className="py-3 pr-4 pl-6 font-semibold">Date</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Type</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Duration</th>
                <th scope="col" className="py-3 pr-4 font-semibold">RPE</th>
                <th scope="col" className="py-3 pr-4 text-right font-semibold">Load</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Notes</th>
                <th scope="col" className="py-3 pr-6 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="group border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/60">
                  <td className="py-3 pr-4 pl-6 whitespace-nowrap text-fg tabular-nums">{formatDate(s.sessionDate)}</td>
                  <td className="py-3 pr-4">
                    <SessionTypeBadge type={s.type} />
                  </td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap text-muted tabular-nums">
                    {formatNumber(s.durationMin)} min
                  </td>
                  <td className="py-3 pr-4">
                    <RpeIndicator rpe={s.rpe} />
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold text-fg tabular-nums">{formatNumber(s.trainingLoad)}</td>
                  <td className="max-w-[16rem] py-3 pr-4 text-muted">
                    {s.notes ? (
                      <span className="line-clamp-2" title={s.notes}>
                        {s.notes}
                      </span>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-6">
                    <SessionActions session={s} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-line md:hidden">
          {sessions.map((s) => (
            <li key={s.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SessionTypeBadge type={s.type} />
                    <span className="text-[13px] text-muted tabular-nums">{formatDate(s.sessionDate)}</span>
                  </div>
                  <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <dt className="text-subtle">Time</dt>
                      <dd className="text-fg">{s.durationMin} min</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="text-subtle">RPE</dt>
                      <dd>
                        <RpeIndicator rpe={s.rpe} />
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-fg tabular-nums">{formatNumber(s.trainingLoad)}</p>
                  <p className="text-[11px] tracking-[0.12em] text-subtle uppercase">Load</p>
                </div>
              </div>
              {s.notes && <p className="mt-2.5 text-[13px] break-words text-muted">{s.notes}</p>}
              <div className="mt-2 -mb-1 flex justify-end">
                <SessionActions session={s} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section aria-labelledby="sessions-heading" aria-busy={query.isFetching}>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
          <div>
            <h2 id="sessions-heading" className="text-base font-semibold text-fg">
              Sessions
            </h2>
            <p className="mt-0.5 text-[13px] text-muted tabular-nums">
              {meta ? pluralize(meta.total, 'session') + (filtered ? ' in range' : ' logged') : ' '}
            </p>
          </div>
          <Button variant="primary" onClick={onAdd} icon={<Plus className="size-4" aria-hidden />}>
            Log session
          </Button>
        </div>
        {query.isFetching && <LoadingLabel>Loading sessions</LoadingLabel>}
        {body}
        {meta && meta.totalPages > 1 && !query.error && (
          <div className="border-t border-line px-4 py-3 sm:px-6">
            <Pagination meta={meta} onPageChange={onPageChange} disabled={query.isFetching} label="Sessions pagination" />
          </div>
        )}
      </Card>
    </section>
  );
}

function SessionActions({ session, onEdit, onDelete }: { session: Session; onEdit: (s: Session) => void; onDelete: (s: Session) => void }) {
  const label = `${session.type} session on ${formatDate(session.sessionDate)}`;
  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton label={`Edit ${label}`} onClick={() => onEdit(session)}>
        <Pencil className="size-4" aria-hidden />
      </IconButton>
      <IconButton label={`Delete ${label}`} tone="danger" onClick={() => onDelete(session)}>
        <Trash2 className="size-4" aria-hidden />
      </IconButton>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-24 rounded-lg" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="hidden h-4 w-12 md:block" />
          <Skeleton className="hidden h-4 w-40 md:block" />
        </div>
      ))}
    </div>
  );
}
