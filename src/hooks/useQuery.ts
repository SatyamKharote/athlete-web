import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { isAbortError } from '../api/client';

interface QueryState<T> {
  /** Request key the state belongs to. */
  key: string | null;
  data: T | undefined;
  error: unknown;
}

export interface QueryResult<T> {
  /** Latest successful data — may belong to a previous key while a new request is in flight. */
  data: T | undefined;
  /** Error for the current key, if the latest request failed. */
  error: unknown;
  /** True while the request for the current key hasn't settled. */
  isFetching: boolean;
  /** True when there's nothing to show yet (first load). */
  isLoading: boolean;
  /** Re-runs the request for the current key. */
  reload: () => void;
  /** Replaces the cached data for the current key (e.g. after a PATCH). */
  setData: (data: T) => void;
}

/**
 * Minimal data-fetching hook: re-fetches whenever `key` changes, aborts stale
 * requests, and keeps previous data on screen while refreshing.
 */
export function useQuery<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>): QueryResult<T> {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<QueryState<T>>({ key: null, data: undefined, error: null });
  const requestKey = `${key}#${nonce}`;

  const runFetcher = useEffectEvent((signal: AbortSignal) => fetcher(signal));

  useEffect(() => {
    const controller = new AbortController();
    runFetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key: requestKey, data, error: null });
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setState((prev) => ({ key: requestKey, data: prev.data, error }));
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (data: T) => setState({ key: requestKey, data, error: null }),
    [requestKey],
  );

  const settled = state.key === requestKey;
  const error = settled ? state.error : null;
  return {
    data: state.data,
    error,
    isFetching: !settled,
    isLoading: !settled && state.data === undefined,
    reload,
    setData,
  };
}
