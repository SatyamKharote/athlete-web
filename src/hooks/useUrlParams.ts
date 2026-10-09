import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Reads a positive integer page number from the URL (defaults to 1). */
export function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export type UpdateSearchParams = (
  updates: Record<string, string | number | undefined>,
  options?: { replace?: boolean },
) => void;

/**
 * Returns a helper that merges values into the URL query string. Empty values
 * (and page=1, the default) are removed so URLs stay clean.
 */
export function useUpdateSearchParams(): UpdateSearchParams {
  const [, setSearchParams] = useSearchParams();
  return useCallback(
    (updates, options) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            if (value === undefined || value === '' || (key === 'page' && value === 1)) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: options?.replace },
      );
    },
    [setSearchParams],
  );
}
