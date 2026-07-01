import Link from 'next/link';
import type { CSSProperties } from 'react';
import { AppListRow, AppListRowLink } from '../../components/app-list-row';
import { StatusPill } from '../../components/status-pill';
import { api } from '../../lib/api';

export default async function DashboardPage() {
  const summary = await api.dashboard();
  const defaultProvider =
    summary.env.providers.find((provider) => provider.isDefault) ??
    summary.env.providers[0];
  const envItems = [
    [
      'OpenRouter',
      summary.env.openRouterConfigured
        ? 'Ready'
        : summary.env.demoMode
          ? 'Browser session'
          : 'Missing key',
    ],
    ['Model', summary.env.openRouterModel],
    [
      'Provider',
      defaultProvider
        ? `${defaultProvider.displayName} / ${
            defaultProvider.configured
              ? defaultProvider.mode
              : summary.env.demoMode
                ? 'Browser sandbox key'
                : 'Missing config'
          }`
        : 'No provider',
    ],
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="cascade-in rounded-[2rem] border border-white/10 bg-white/[0.045] px-6 py-7 shadow-[0_24px_70px_-48px_rgba(24,24,27,0.38)] md:px-7 md:py-10">
          <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
            Developer transactional email studio
          </div>
          <h1 className="mt-5 max-w-[12ch] text-5xl font-semibold leading-[0.94] tracking-tighter text-zinc-50 md:text-7xl">
            Build templates that can ship.
          </h1>
          <p className="mt-6 max-w-[62ch] text-base leading-7 text-zinc-400">
            Generate MJML, text fallbacks, variable contracts, sample payloads,
            and provider deployments from one self-hosted workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/templates/generate"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-[#96b84c] active:translate-y-px"
            >
              Generate template
            </Link>
            <Link
              href="/templates"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-zinc-200 transition duration-300 hover:border-white/20 active:translate-y-px"
            >
              View library
            </Link>
          </div>
        </div>

        <div className="cascade-in rounded-[2rem] border border-white/10 bg-[#23231f] px-6 py-7 text-zinc-50 shadow-[0_24px_70px_-48px_rgba(24,24,27,0.58)] md:px-7 md:py-8 [--index:1]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-50/50">
                Environment
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Readiness
              </h2>
            </div>
            <span className="breathing-dot h-3 w-3 rounded-full bg-[#a7c957]" />
          </div>
          <div className="mt-6 divide-y divide-white/10">
            {envItems.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 py-3 text-sm">
                <div className="font-mono uppercase tracking-[0.16em] text-zinc-50/42">
                  {label}
                </div>
                <div className="break-words text-zinc-50/88">{value}</div>
              </div>
            ))}
          </div>
          {summary.env.warnings.length > 0 ? (
            <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.07] p-4 text-sm leading-6 text-zinc-300">
              {summary.env.warnings[0]}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1.4fr]">
        {[
          ['Templates', summary.templateCount],
          ['Ready', summary.readyCount],
          ['Deployed', summary.deployedCount],
        ].map(([label, value], index) => (
          <div
            key={label}
            className="cascade-in rounded-[1.5rem] border border-white/10 bg-white/[0.045] px-6 py-5 shadow-[0_20px_60px_-52px_rgba(0,0,0,0.85)] md:px-7"
            style={{ '--index': index + 2 } as CSSProperties & Record<'--index', number>}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              {label}
            </div>
            <div className="mt-2 font-mono text-5xl font-semibold tracking-tighter text-zinc-50">
              {value}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="cascade-in rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 [--index:5]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent templates</h2>
            <Link href="/templates" className="text-sm font-semibold text-zinc-400 hover:text-zinc-50">
              Library
            </Link>
          </div>
          <div className="mt-5 divide-y divide-white/10">
            {summary.recentTemplates.length === 0 ? (
              <div className="py-10 text-sm text-zinc-500">
                Generate the first transactional template to populate the library.
              </div>
            ) : (
              summary.recentTemplates.map((template) => (
                <AppListRowLink
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="md:grid-cols-[1fr_9rem] md:items-center"
                >
                  <div>
                    <div className="font-medium text-zinc-50">{template.name}</div>
                    <div className="mt-1 text-sm text-zinc-500">{template.subject}</div>
                  </div>
                  <div className="md:text-right">
                    <StatusPill tone="success">{template.status}</StatusPill>
                  </div>
                </AppListRowLink>
              ))
            )}
          </div>
        </div>

        <div className="cascade-in rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 [--index:6]">
          <h2 className="text-xl font-semibold tracking-tight">Provider deploys</h2>
          <div className="mt-5 divide-y divide-white/10">
            {summary.recentDeployments.length === 0 ? (
              <div className="py-10 text-sm text-zinc-500">
                Deployments appear here after a template is pushed to a provider.
              </div>
            ) : (
              summary.recentDeployments.map((deployment) => (
                <AppListRow key={deployment.id}>
                  <div className="font-medium text-zinc-50">{deployment.templateName}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill>
                      {deployment.provider} / {deployment.mode} / {deployment.status}
                    </StatusPill>
                  </div>
                </AppListRow>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
