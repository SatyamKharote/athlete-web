import { ArrowLeft, CalendarDays, Mail, Pencil, Trash2, UserX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { deleteAthlete, getAthlete } from '../api/athletes';
import { ApiError, getErrorMessage } from '../api/client';
import { deleteSession } from '../api/sessions';
import type { Athlete, DateRange, Session } from '../api/types';
import { AthleteFormModal } from '../components/AthleteFormModal';
import { Avatar, SportBadge } from '../components/Badges';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { SessionFormModal } from '../components/SessionFormModal';
import { SessionsSection } from '../components/SessionsSection';
import { Card, EmptyState, ErrorState, Eyebrow, LoadingLabel, Skeleton } from '../components/States';
import { TrainingLoadSection } from '../components/TrainingLoadSection';
import { useQuery } from '../hooks/useQuery';
import { useToast } from '../hooks/useToast';
import { parsePage, useUpdateSearchParams } from '../hooks/useUrlParams';
import { isValidISODate } from '../lib/dates';
import { formatDate, formatTimestamp } from '../lib/format';

export function AthleteDetailPage() {
  const { id = '' } = useParams();
  // Keying by id resets all page state when navigating between athletes.
  return <AthleteDetail key={id} id={id} />;
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 self-start rounded-md text-[13px] font-medium text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All athletes
    </Link>
  );
}

function AthleteDetail({ id }: { id: string }) {
  const toast = useToast();
  const navigate = useNavigate();
  const athleteQuery = useQuery(`athlete:${id}`, (signal) => getAthlete(id, signal));
  const athlete = athleteQuery.data;

  useEffect(() => {
    document.title = athlete ? `${athlete.name} · Athlete Training` : 'Athlete · Athlete Training';
    return () => {
      document.title = 'Athlete Training';
    };
  }, [athlete]);

  // Range + sessions page live in the URL so refresh/back keep the view.
  const [searchParams] = useSearchParams();
  const updateParams = useUpdateSearchParams();
  const fromParam = searchParams.get('from') ?? '';
  const toParam = searchParams.get('to') ?? '';
  const range: DateRange = {
    from: isValidISODate(fromParam) ? fromParam : undefined,
    to: isValidISODate(toParam) ? toParam : undefined,
  };
  const sessionsPage = parsePage(searchParams.get('page'));
  const rangeError =
    range.from && range.to && range.from > range.to ? 'The “from” date must be on or before the “to” date.' : null;

  const setRange = (next: DateRange) => updateParams({ from: next.from, to: next.to, page: undefined }, { replace: true });
  const setSessionsPage = useCallback(
    (page: number, options?: { replace?: boolean }) => updateParams({ page }, options),
    [updateParams],
  );

  // Bumped after any session change so the chart and list both refetch.
  const [dataVersion, setDataVersion] = useState(0);

  const [editAthleteOpen, setEditAthleteOpen] = useState(false);
  const [deleteAthleteOpen, setDeleteAthleteOpen] = useState(false);
  const [deletingAthlete, setDeletingAthlete] = useState(false);

  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  function openLogSession() {
    setEditingSession(null);
    setSessionFormOpen(true);
  }

  function openEditSession(session: Session) {
    setEditingSession(session);
    setSessionFormOpen(true);
  }

  async function confirmDeleteAthlete() {
    if (!athlete) return;
    setDeletingAthlete(true);
    try {
      await deleteAthlete(athlete.id);
      toast.success(`${athlete.name} deleted.`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeletingAthlete(false);
    }
  }

  async function confirmDeleteSession() {
    if (!sessionToDelete) return;
    setDeletingSession(true);
    try {
      await deleteSession(sessionToDelete.id);
      toast.success('Session deleted.');
      setSessionToDelete(null);
      setDataVersion((v) => v + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingSession(false);
    }
  }

  if (athleteQuery.error && !athleteQuery.isFetching) {
    const notFound =
      athleteQuery.error instanceof ApiError && (athleteQuery.error.status === 404 || athleteQuery.error.status === 400);
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <Card>
          {notFound ? (
            <EmptyState
              icon={<UserX className="size-5" aria-hidden />}
              title="Athlete not found"
              description="This athlete may have been deleted, or the link is incorrect."
              action={
                <Link
                  to="/"
                  className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-strong"
                >
                  Back to athletes
                </Link>
              }
            />
          ) : (
            <ErrorState title="Couldn’t load athlete" error={athleteQuery.error} onRetry={athleteQuery.reload} />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <BackLink />

      {athlete ? (
        <ProfileHeader athlete={athlete} onEdit={() => setEditAthleteOpen(true)} onDelete={() => setDeleteAthleteOpen(true)} />
      ) : (
        <ProfileSkeleton />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow>Training load</Eyebrow>
          <p className="text-sm text-muted">
            {range.from || range.to ? (
              <>
                Showing {range.from ? formatDate(range.from) : 'the beginning'} – {range.to ? formatDate(range.to) : 'today'}
              </>
            ) : (
              'Showing all recorded training'
            )}
          </p>
        </div>
        <DateRangeFilter range={range} onChange={setRange} error={rangeError} />
      </div>

      {rangeError ? (
        <Card>
          <EmptyState
            icon={<CalendarDays className="size-5" aria-hidden />}
            title="Invalid date range"
            description="Adjust the dates above so “from” comes before “to”."
            action={<Button onClick={() => setRange({})}>Reset range</Button>}
          />
        </Card>
      ) : (
        <>
          <TrainingLoadSection athleteId={id} range={range} refreshKey={dataVersion} onLogSession={openLogSession} />
          <SessionsSection
            athleteId={id}
            range={range}
            page={sessionsPage}
            onPageChange={setSessionsPage}
            refreshKey={dataVersion}
            onAdd={openLogSession}
            onEdit={openEditSession}
            onDelete={setSessionToDelete}
          />
        </>
      )}

      <AthleteFormModal
        open={editAthleteOpen}
        athlete={athlete}
        onClose={() => setEditAthleteOpen(false)}
        onSaved={(saved) => {
          setEditAthleteOpen(false);
          athleteQuery.setData(saved);
        }}
      />

      <ConfirmDialog
        open={deleteAthleteOpen}
        title="Delete athlete?"
        description={
          <>
            <span className="font-medium text-fg">{athlete?.name}</span> and all of their training sessions will be
            permanently deleted.
          </>
        }
        confirmLabel="Delete athlete"
        busy={deletingAthlete}
        onConfirm={confirmDeleteAthlete}
        onCancel={() => setDeleteAthleteOpen(false)}
      />

      <SessionFormModal
        open={sessionFormOpen}
        athleteId={id}
        session={editingSession}
        onClose={() => setSessionFormOpen(false)}
        onSaved={() => {
          setSessionFormOpen(false);
          setDataVersion((v) => v + 1);
        }}
      />

      <ConfirmDialog
        open={sessionToDelete !== null}
        title="Delete session?"
        description={
          sessionToDelete && (
            <>
              The <span className="font-medium text-fg">{sessionToDelete.type}</span> session on{' '}
              <span className="font-medium text-fg">{formatDate(sessionToDelete.sessionDate)}</span> (load{' '}
              {sessionToDelete.trainingLoad}) will be removed.
            </>
          )
        }
        confirmLabel="Delete session"
        busy={deletingSession}
        onConfirm={confirmDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
}

function ProfileHeader({ athlete, onEdit, onDelete }: { athlete: Athlete; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="relative overflow-hidden p-5 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/[0.06] blur-3xl"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <Avatar name={athlete.name} size="lg" />
          <div className="min-w-0">
            <SportBadge sport={athlete.sport} />
            <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">{athlete.name}</h1>
            <div className="mt-1.5 flex flex-col gap-1 text-[13px] text-muted sm:flex-row sm:items-center sm:gap-4">
              <span className="flex min-w-0 items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{athlete.email}</span>
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                Added {formatTimestamp(athlete.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit} icon={<Pencil className="size-4" aria-hidden />} className="flex-1 sm:flex-none">
            Edit
          </Button>
          <Button variant="danger" onClick={onDelete} icon={<Trash2 className="size-4" aria-hidden />} className="flex-1 sm:flex-none">
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <Card className="p-5 sm:p-8">
      <LoadingLabel>Loading athlete</LoadingLabel>
      <div className="flex items-center gap-4 sm:gap-5">
        <Skeleton className="size-16 rounded-full sm:size-20" />
        <div className="flex flex-1 flex-col gap-2.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
    </Card>
  );
}
