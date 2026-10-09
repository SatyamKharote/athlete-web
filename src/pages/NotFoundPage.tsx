import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found · Athlete Training';
    return () => {
      document.title = 'Athlete Training';
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center sm:py-28">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">Error 404</p>
      <p className="mt-3 text-7xl font-bold tracking-tighter text-fg tabular-nums sm:text-8xl" aria-hidden>
        4<span className="text-accent">0</span>4
      </p>
      <h1 className="mt-4 text-xl font-semibold text-fg">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you’re looking for doesn’t exist or has moved. Let’s get you back on track.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-strong"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to athletes
      </Link>
    </div>
  );
}
