import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppNav } from './app-nav';
import { isMarketplaceEnabled } from '../lib/features';

export function AppShell({ children }: { children: ReactNode }) {
  const marketplaceEnabled = isMarketplaceEnabled();

  return (
    <main className="grain min-h-dvh w-full max-w-full overflow-x-hidden text-zinc-100 lg:h-dvh lg:overflow-hidden">
      <div className="grid min-h-dvh grid-cols-1 lg:h-dvh lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#0d0d10]/[0.92] px-4 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl lg:h-dvh lg:overflow-hidden lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
          <div className="flex items-start justify-between gap-4 lg:block">
            <Link href="/dashboard" className="block">
              <div className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-zinc-500">
                TemplateForge
              </div>
              <div className="mt-2 max-w-[13rem] text-xl font-semibold leading-none tracking-tight text-zinc-50">
                Email Template Workbench
              </div>
            </Link>

          </div>

          <AppNav marketplaceEnabled={marketplaceEnabled} />

          <div className="mt-8 hidden border-t border-white/10 pt-5 lg:block">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
              Agent context
            </div>
            <p className="mt-3 max-w-[25ch] text-sm leading-6 text-zinc-400">
              Brand assets, reusable headers, footers, variables, and provider deploy logs.
            </p>
          </div>
        </aside>

        <section className="scanline min-w-0 px-4 py-5 md:px-8 md:py-8 lg:h-dvh lg:overflow-y-auto">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
