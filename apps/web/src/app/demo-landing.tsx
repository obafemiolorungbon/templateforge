'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  ArrowRight,
  BracketsCurly,
  PaperPlaneTilt,
  StackSimple,
} from '@phosphor-icons/react';

const demoHighlights = [
  {
    title: 'MJML source',
    body: 'Generate structured MJML with matching text fallbacks.',
    Icon: BracketsCurly,
  },
  {
    title: 'Sandbox deploy',
    body: 'Preview and deploy templates through provider adapters.',
    Icon: PaperPlaneTilt,
  },
  {
    title: 'Template library',
    body: 'Organize generated templates, versions, and marketplace imports.',
    Icon: StackSimple,
  },
];

export function DemoLanding() {
  return (
    <div className="min-h-dvh overflow-hidden px-4 py-5 md:px-8 md:py-8">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
          TemplateForge
        </Link>
        <Link
          href="/onboarding"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#a7c957] px-4 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
        >
          Start building
          <ArrowRight size={16} weight="bold" />
        </Link>
      </nav>

      <section className="mx-auto grid min-h-[calc(100dvh-6rem)] max-w-[1400px] grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)] lg:py-20">
        <div>
          <div className="max-w-[11rem] border-t border-[#a7c957]/60 pt-4 font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
            Private email template lab
          </div>
          <h1 className="mt-8 max-w-[13ch] text-5xl font-semibold leading-[0.94] tracking-tighter text-zinc-50 md:text-7xl">
            Build transactional email templates from prompt to provider.
          </h1>
          <p className="mt-7 max-w-[62ch] text-base leading-7 text-zinc-400">
            TemplateForge helps teams generate MJML, inspect variables, preview
            provider output, and manage template versions from one developer
            workbench.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a7c957] px-6 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
            >
              Connect keys
              <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-6 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07] active:translate-y-px"
            >
              Open workbench
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-white/10 bg-[#111113]/88 p-5 shadow-[0_30px_90px_-52px_rgba(0,0,0,0.75)] backdrop-blur-xl md:p-6">
            <div className="grid gap-3">
              {demoHighlights.map(({ title, body, Icon }, index) => (
                <div
                  key={title}
                  className="cascade-in rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4"
                  style={{ '--index': index } as CSSProperties & Record<'--index', number>}
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#a7c957]/12 text-[#d8ef9a]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <div className="font-semibold text-zinc-50">{title}</div>
                      <div className="mt-1 text-sm leading-6 text-zinc-500">{body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
