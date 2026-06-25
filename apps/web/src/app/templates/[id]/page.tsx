import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '../../../lib/api';
import { isDemoMode } from '../../../lib/features';
import { TemplateCodeSamples } from './template-code-samples';
import { TemplateDetailActions } from './template-detail-actions';
import { TemplateSourceEditor } from './template-source-editor';
import { TemplateVariableEditor } from './template-variable-editor';

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const demoMode = isDemoMode();
  const [template, brand, providers] = await Promise.all([
    api.template(id).catch(() => null),
    api.brand().catch(() => null),
    api.providers().catch(() => []),
  ]);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-7">
      <header className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto]">
        <div>
          <Link
            href="/templates"
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-50"
          >
        Template library
          </Link>
          <h1 className="mt-3 max-w-[15ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
            {template.name}
          </h1>
          <p className="mt-4 max-w-[70ch] text-base leading-7 text-zinc-400">
            {template.subject}
          </p>
        </div>
        <div className="self-end rounded-[1.35rem] border border-white/10 bg-white/[0.045] px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
          {template.status} / {template.latestDeploymentProvider ?? 'local only'}
        </div>
      </header>

      <VersionPanel template={template} />

      <TemplateDetailActions
        template={template}
        brandComponents={brand?.components ?? []}
        providers={providers}
        demoMode={demoMode}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <TemplateSourceEditor template={template} />

        <div className="space-y-6">
          <TemplateVariableEditor template={template} />
          <TemplateCodeSamples templateId={template.id} providers={providers} />
        </div>
      </section>
    </div>
  );
}

function VersionPanel({ template }: { template: Awaited<ReturnType<typeof api.template>> }) {
  const latest = template.versions[0];

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
            Current version
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="text-2xl font-semibold tracking-tight text-zinc-50">
              v{latest?.version ?? 1}
            </div>
            <div className="text-sm text-zinc-400">
              {latest?.changeNote ?? 'Initial generated draft'}
            </div>
          </div>
        </div>
        <details className="rounded-xl border border-white/10 bg-zinc-950/40">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-300">
            View version history
          </summary>
          <div className="max-h-64 min-w-[min(24rem,calc(100vw-4rem))] overflow-auto border-t border-white/10 px-4 py-2">
            {template.versions.map((version) => (
              <div key={version.id} className="grid grid-cols-[3rem_1fr] gap-3 py-3">
                <div className="font-mono text-sm text-zinc-500">v{version.version}</div>
                <div>
                  <div className="text-sm font-medium text-zinc-50">
                    {version.changeNote ?? 'Template update'}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
