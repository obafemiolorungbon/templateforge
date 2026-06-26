import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { api } from '../../../lib/api';
import { isMarketplaceEnabled } from '../../../lib/features';

export default async function MarketplaceTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isMarketplaceEnabled()) {
    notFound();
  }

  const { id } = await params;
  const template = await api.marketplaceTemplate(id).catch(() => null);

  if (!template) {
    notFound();
  }

  async function importTemplate() {
    'use server';

    const imported = await api.importMarketplaceTemplate(id);
    redirect(`/templates/${imported.id}`);
  }

  return (
    <div className="space-y-7">
      <header className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto]">
        <div>
          <Link
            href="/marketplace"
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-50"
          >
            Marketplace
          </Link>
          <h1 className="mt-3 max-w-[14ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
            {template.name}
          </h1>
          <p className="mt-4 max-w-[70ch] text-base leading-7 text-zinc-400">
            {template.description}
          </p>
        </div>
        <form action={importTemplate} className="self-end">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px"
          >
            Import template
          </button>
        </form>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Version" value={`v${template.version}`} />
        <Stat label="Category" value={template.category} />
        <Stat label="Author" value={template.author ?? 'Unknown'} />
        <Stat label="License" value={template.license ?? 'Unspecified'} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {template.preview ? (
            <Panel title="Preview">
              <div className="overflow-hidden rounded-[1.1rem] border border-white/10 bg-zinc-950">
                <img
                  src={template.preview}
                  alt={`${template.name} email preview`}
                  className="max-h-[46rem] w-full object-cover object-top"
                />
              </div>
            </Panel>
          ) : null}
          <Panel title="Subject">
            <code className="text-sm text-zinc-200">{template.subject}</code>
          </Panel>
          <Panel title="MJML source">
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-[1.1rem] bg-zinc-950/70 p-4 text-xs leading-6 text-zinc-300">
              {template.mjml}
            </pre>
          </Panel>
          <Panel title="Text fallback">
            <pre className="whitespace-pre-wrap rounded-[1.1rem] bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-300">
              {template.text}
            </pre>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Variable contract">
            <div className="space-y-3">
              {template.variables.map((variable) => (
                <div
                  key={variable.name}
                  className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-sm font-semibold text-zinc-50">
                      {variable.name}
                    </code>
                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-zinc-500">
                      {variable.format
                        ? `${variable.type} / ${variable.format}`
                        : variable.type}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {variable.description}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Sample payload">
            <pre className="max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-[1.1rem] bg-zinc-950/70 p-4 text-xs leading-6 text-zinc-300">
              {JSON.stringify(template.sampleVariables, null, 2)}
            </pre>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
      <div className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-zinc-100">
        {value}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </h2>
      {children}
    </section>
  );
}
