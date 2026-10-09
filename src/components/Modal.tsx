import { X } from 'lucide-react';
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/format';
import { IconButton } from './Button';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
  /** When true, Escape/backdrop/close button are ignored (e.g. while saving). */
  busy?: boolean;
  role?: 'dialog' | 'alertdialog';
}

export function Modal({ open, ...props }: ModalProps) {
  if (!open) return null;
  return createPortal(<ModalContent {...props} />, document.body);
}

function ModalContent({
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  busy = false,
  role = 'dialog',
}: Omit<ModalProps, 'open'>) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    if (!busy) onClose();
  };
  const requestClose = useEffectEvent(close);

  // Focus management, scroll lock and restoring focus on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const autoFocus = panel?.querySelector<HTMLElement>('[data-autofocus]');
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (autoFocus ?? firstFocusable ?? panel)?.focus();

    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Escape to close + focus trap.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={close}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'animate-pop-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line bg-surface shadow-2xl shadow-black/60 focus:outline-none',
          'rounded-t-3xl sm:rounded-2xl',
          size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-fg">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm text-muted">
                {description}
              </div>
            )}
          </div>
          <IconButton label="Close dialog" onClick={close} disabled={busy} className="-mt-1 -mr-2">
            <X className="size-5" aria-hidden />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 pt-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
