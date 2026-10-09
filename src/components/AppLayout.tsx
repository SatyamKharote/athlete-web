import { Link, Outlet } from 'react-router-dom';

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--color-surface-2)" stroke="var(--color-line-strong)" />
      <path
        d="M6 20.5h4.5l3-9 4 13 3-8.5H26"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5 rounded-lg" aria-label="Athlete Training — home">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight text-fg">
              Athlete<span className="text-muted transition-colors group-hover:text-fg"> Training</span>
            </span>
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 focus:outline-none sm:px-6 sm:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
