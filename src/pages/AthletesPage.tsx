import { ChevronRight, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { deleteAthlete, listAthletes } from '../api/athletes';
import { getErrorMessage } from '../api/client';
import type { Athlete } from '../api/types';
import { AthleteFormModal } from '../components/AthleteFormModal';
import { Avatar, SportBadge } from '../components/Badges';
import { Button, IconButton } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { controlClass } from '../components/FormField';
import { Pagination } from '../components/Pagination';
import { Card, EmptyState, ErrorState, Eyebrow, LoadingLabel, Skeleton } from '../components/States';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { useQuery } from '../hooks/useQuery';
import { useToast } from '../hooks/useToast';
import { parsePage, useUpdateSearchParams } from '../hooks/useUrlParams';
import { cn, formatNumber, formatTimestamp } from '../lib/format';

const PAGE_SIZE = 10;

export function AthletesPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const updateParams = useUpdateSearchParams();
  const search = searchParams.get('q') ?? '';
  const page = parsePage(searchParams.get('page'));

  // Local input state, kept in sync when the URL changes (back/forward).
  const [input, setInput] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setInput(search);
  }

  const commitSearch = useDebouncedCallback((value: string) => {
    updateParams({ q: value.trim(), page: undefined }, { replace: true });
  }, 300);

  const query = useQuery(`athletes:${search}:${page}`, (signal) =>
    listAthletes({ search: search.trim() || undefined, page, limit: PAGE_SIZE }, signal),
  );
  const meta = query.data?.meta;
  const athletes = query.data?.data ?? [];

  // Step back if the page no longer exists (e.g. after deleting the last athlete on it).
  useEffect(() => {
    if (!query.isFetching && meta && meta.totalPages > 0 && page > meta.totalPages) {
      updateParams({ page: meta.totalPages }, { replace: true });
    }
  }, [query.isFetching, meta, page, updateParams]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Athlete | null>(null);
  const [deleting, setDeleting] = useState<Athlete | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(athlete: Athlete) {
    setEditing(athlete);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAthlete(deleting.id);
      toast.success(`${deleting.name} deleted.`);
      setDeleting(null);
      query.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  function goToPage(next: number) {
    updateParams({ page: next });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearSearch() {
    setInput('');
    commitSearch('');
    searchRef.current?.focus();
  }

  let body: ReactNode;
  if (query.error && !query.isFetching) {
    body = <ErrorState title="Couldn’t load athletes" error={query.error} onRetry={query.reload} />;
  } else if (query.isLoading) {
    body = <AthletesSkeleton />;
  } else if (athletes.length === 0) {
    body = search ? (
      <EmptyState
        icon={<Search className="size-5" aria-hidden />}
        title="No matching athletes"
        description={<>Nothing matches “{search}”. Check the spelling or try a different name or email.</>}
        action={<Button onClick={clearSearch}>Clear search</Button>}
      />
    ) : (
      <EmptyState
        icon={<Users className="size-5" aria-hidden />}
        title="No athletes yet"
        description="Add your first athlete to start logging sessions and tracking training load."
        action={
          <Button variant="primary" onClick={openCreate} icon={<Plus className="size-4" aria-hidden />}>
            Add athlete
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className={cn('transition-opacity duration-200', query.isFetching && 'opacity-60')}>
        <AthletesTable athletes={athletes} onOpen={(a) => navigate(`/athletes/${a.id}`)} onEdit={openEdit} onDelete={setDeleting} />
        <AthleteCards athletes={athletes} onEdit={openEdit} onDelete={setDeleting} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Athlete Training</Eyebrow>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-fg sm:text-4xl">Athletes</h1>
          <p className="mt-2 text-sm text-muted tabular-nums" aria-live="polite">
            {meta ? (
              search ? (
                <>
                  <span className="font-semibold text-accent">{formatNumber(meta.total)}</span>{' '}
                  {meta.total === 1 ? 'athlete matches' : 'athletes match'} “{search}”
                </>
              ) : (
                <>
                  <span className="font-semibold text-accent">{formatNumber(meta.total)}</span>{' '}
                  {meta.total === 1 ? 'athlete' : 'athletes'} on the roster
                </>
              )
            ) : (
              <span className="inline-block h-4 w-36 animate-shimmer rounded bg-surface-3 align-middle" aria-hidden />
            )}
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} icon={<Plus className="size-4" aria-hidden />} className="self-start sm:self-auto">
          Add athlete
        </Button>
      </header>

      <Card className="overflow-hidden">
        <div className="border-b border-line p-3 sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="athlete-search" className="sr-only">
              Search athletes by name or email
            </label>
            <input
              id="athlete-search"
              ref={searchRef}
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search by name or email"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                commitSearch(e.target.value);
              }}
              className={cn(controlClass, 'h-11 border-line pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden')}
            />
            {input && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <div aria-busy={query.isFetching}>
          {query.isFetching && <LoadingLabel>Loading athletes</LoadingLabel>}
          {body}
        </div>

        {meta && meta.total > 0 && !query.error && (
          <div className="border-t border-line px-4 py-3 sm:px-6">
            <Pagination meta={meta} onPageChange={goToPage} disabled={query.isFetching} label="Athletes pagination" />
          </div>
        )}
      </Card>

      <AthleteFormModal
        open={formOpen}
        athlete={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          query.reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete athlete?"
        description={
          <>
            <span className="font-medium text-fg">{deleting?.name}</span> and all of their training sessions will be
            permanently deleted.
          </>
        }
        confirmLabel="Delete athlete"
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

interface ListProps {
  athletes: Athlete[];
  onEdit: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
}

function AthletesTable({ athletes, onOpen, onEdit, onDelete }: ListProps & { onOpen: (athlete: Athlete) => void }) {
  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, athlete: Athlete) {
    // Let links and buttons inside the row handle their own clicks.
    if ((event.target as HTMLElement).closest('a, button')) return;
    onOpen(athlete);
  }

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <caption className="sr-only">Athletes</caption>
        <thead>
          <tr className="border-b border-line text-left text-[11px] tracking-[0.12em] text-muted uppercase">
            <th scope="col" className="py-3 pr-4 pl-6 font-semibold">Name</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Email</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Sport</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Created</th>
            <th scope="col" className="py-3 pr-6 text-right font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete) => (
            <tr
              key={athlete.id}
              onClick={(e) => handleRowClick(e, athlete)}
              className="group cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/60"
            >
              <td className="py-3 pr-4 pl-6">
                <Link
                  to={`/athletes/${athlete.id}`}
                  className="flex items-center gap-3 rounded-md font-medium text-fg transition-colors group-hover:text-accent"
                >
                  <Avatar name={athlete.name} />
                  <span className="truncate">{athlete.name}</span>
                </Link>
              </td>
              <td className="max-w-[16rem] truncate py-3 pr-4 text-muted">{athlete.email}</td>
              <td className="py-3 pr-4">
                <SportBadge sport={athlete.sport} />
              </td>
              <td className="py-3 pr-4 whitespace-nowrap text-muted tabular-nums">{formatTimestamp(athlete.createdAt)}</td>
              <td className="py-3 pr-6">
                <div className="flex items-center justify-end gap-1">
                  <IconButton label={`Edit ${athlete.name}`} onClick={() => onEdit(athlete)}>
                    <Pencil className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton label={`Delete ${athlete.name}`} tone="danger" onClick={() => onDelete(athlete)}>
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                  <ChevronRight className="ml-1 size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-muted" aria-hidden />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AthleteCards({ athletes, onEdit, onDelete }: ListProps) {
  return (
    <ul className="divide-y divide-line md:hidden">
      {athletes.map((athlete) => (
        <li key={athlete.id} className="relative flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-surface-2/60">
          <Avatar name={athlete.name} />
          <div className="min-w-0 flex-1">
            <Link
              to={`/athletes/${athlete.id}`}
              className="block truncate font-medium text-fg after:absolute after:inset-0 after:content-['']"
            >
              {athlete.name}
            </Link>
            <p className="truncate text-[13px] text-muted">{athlete.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <SportBadge sport={athlete.sport} />
              <span className="text-[12px] text-subtle tabular-nums">{formatTimestamp(athlete.createdAt)}</span>
            </div>
          </div>
          <div className="relative z-10 flex items-center">
            <IconButton label={`Edit ${athlete.name}`} onClick={() => onEdit(athlete)}>
              <Pencil className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Delete ${athlete.name}`} tone="danger" onClick={() => onDelete(athlete)}>
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AthletesSkeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4 md:px-6">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-8">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44 md:h-4" />
            <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
          </div>
        </div>
      ))}
    </div>
  );
}
