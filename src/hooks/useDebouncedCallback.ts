import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/** Returns a stable function that runs `callback` after `delay` ms without further calls. */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return useCallback(
    (...args: A) => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );
}
