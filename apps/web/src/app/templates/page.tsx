import Link from 'next/link';
import type { CSSProperties } from 'react';
import { AppListRowLink } from '../../components/app-list-row';
import { RowActionIcon } from '../../components/row-action-icon';
import { StatusPill } from '../../components/status-pill';
import { api } from '../../lib/api';

export default async function TemplatesPage() {
  const templates = await api.templates();

  return (
    <div className="space-y-7">
      <header className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
            Template library
          </div>
          <h1 className="mt-3 max-w-[13ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
            Contract-first email assets.
          </h1>
        </div>
        <Link
          href="/templates/generate"
          className="inline-flex min-h-11 items-center justify-center self-end rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px"
        >
          Generate template
        </Link>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.35)] md:p-6">
        {templates.length === 0 ? (
          <div className="grid min-h-[22rem] place-items-center rounded-[1.5rem] bg-white/[0.055] p-8 text-center">
            <div>
              <div className="mx-auto h-16 w-16 rounded-[1.25rem] border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                No templates yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Generate an MJML template with variables and sample payloads,
                then deploy it to a configured email provider.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {templates.map((template, index) => (
              <AppListRowLink
                key={template.id}
                href={`/templates/${template.id}`}
                className="md:grid-cols-[minmax(0,1fr)_8rem_8rem_2rem] md:items-center"
                style={{ '--index': index } as CSSProperties & Record<'--index', number>}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-50">
                      {template.name}
                    </h2>
                    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500">
                      {template.category}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm text-zinc-500">
                    {template.subject}
                  </p>
                </div>
                <div>
                  <StatusPill tone="success">{template.status}</StatusPill>
                </div>
                <div>
                  <StatusPill>
                    {template.latestDeploymentProvider
                      ? `${template.latestDeploymentProvider} / ${template.latestDeploymentStatus}`
                      : 'Not pushed'}
                  </StatusPill>
                </div>
                <div className="hidden text-zinc-500 transition group-hover:text-[#d8ef9a] md:block">
                  <RowActionIcon />
                </div>
              </AppListRowLink>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
