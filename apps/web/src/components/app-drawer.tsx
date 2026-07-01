'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

type AppDrawerProps = {
  open: boolean;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  headerAddon?: ReactNode;
  widthClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeLabel?: string;
  onClose: () => void;
};

export function AppDrawer({
  open,
  title,
  eyebrow,
  description,
  children,
  footer,
  headerAddon,
  widthClassName = 'max-w-[760px]',
  bodyClassName = '',
  footerClassName = '',
  closeLabel = 'Close drawer',
  onClose,
}: AppDrawerProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 top-0 z-[120] overflow-hidden bg-zinc-950/72 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={onClose}
    >
      <aside
        className={[
          'fixed bottom-0 right-0 top-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col border-l border-white/10 bg-[#0d0d10] shadow-[0_24px_90px_-42px_rgba(0,0,0,0.95)]',
          widthClassName,
        ].join(' ')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 border-b border-white/10 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow ? (
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {eyebrow}
                </div>
              ) : null}
              <h2
                id={titleId}
                className="text-xl font-semibold leading-tight tracking-tight text-zinc-50 md:text-2xl"
              >
                {title}
              </h2>
              {description ? (
                <div className="mt-2 max-w-[68ch] text-sm leading-6 text-zinc-500">
                  {description}
                </div>
              ) : null}
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.045] text-zinc-400 transition hover:border-white/20 hover:text-zinc-50 focus-visible:border-[#a7c957]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7c957]/20 active:translate-y-px"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          {headerAddon ? <div className="mt-5">{headerAddon}</div> : null}
        </header>

        <div
          className={[
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-8',
            bodyClassName,
          ].join(' ')}
        >
          {children}
        </div>

        {footer ? (
          <footer
            className={[
              'shrink-0 border-t border-white/10 bg-[#0d0d10]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
              footerClassName,
            ].join(' ')}
          >
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
