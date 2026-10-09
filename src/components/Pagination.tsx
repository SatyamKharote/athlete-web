import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../api/types';
import { cn, formatNumber } from '../lib/format';
import { Button } from './Button';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Pagination({ meta, onPageChange, disabled, label = 'Pagination', className }: PaginationProps) {
  const totalPages = Math.max(meta.totalPages, 1);
  const page = Math.min(meta.page, totalPages);
  const start = meta.total === 0 ? 0 : (page - 1) * meta.limit + 1;
  const end = Math.min(page * meta.limit, meta.total);

  return (
    <nav
      aria-label={label}
      className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}
    >
      <p className="text-[13px] text-muted tabular-nums">
        {meta.total > 0 ? (
          <>
            Showing <span className="text-fg">{formatNumber(start)}–{formatNumber(end)}</span> of{' '}
            <span className="text-fg">{formatNumber(meta.total)}</span>
          </>
        ) : (
          'No results'
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          icon={<ChevronLeft className="size-4" aria-hidden />}
          aria-label="Previous page"
        >
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="min-w-[7rem] text-center text-[13px] text-muted tabular-nums" aria-current="page">
          Page <span className="font-medium text-fg">{formatNumber(page)}</span> of{' '}
          <span className="font-medium text-fg">{formatNumber(totalPages)}</span>
        </span>
        <Button
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
