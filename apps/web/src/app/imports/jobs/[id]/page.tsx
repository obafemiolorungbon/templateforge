import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { StatusPill } from '../../../../components/status-pill';
import { api } from '../../../../lib/api';
import { ImportJobActions } from './import-job-actions';

export default async function ImportJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await api.importJob(id).catch(() => null);

  if (!job) {
    notFound();
  }

  const recovered = job.intentAst?.sections.map((section) => section.kind) ?? [];

  return (
    <div className="space-y-7">
      <header className="max-w-3xl">
        <Link
          href="/imports"
          className="inline-flex text-sm font-semibold text-[#d8ef9a] transition hover:text-zinc-50"
        >
          Back to imports
        </Link>
        <div className="mt-5 font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
          Import review
        </div>
        <h1 className="mt-3 max-w-[13ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
          Inspect before saving.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">
          Review confidence, warnings, recovered intent, MJML, and rendered HTML
          before this import becomes a saved header/footer or template.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat
          label="Status"
          value={
            <StatusPill tone={job.status === 'COMPLETED' ? 'success' : 'warning'}>
              {job.status}
            </StatusPill>
          }
        />
        <Stat label="Mode" value={job.mode.replace('_', ' ')} />
        <Stat
          label="Confidence"
          value={job.confidence ? `${job.confidence.score}%` : 'Pending'}
        />
        <Stat label="Warnings" value={String(job.warnings.length)} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <PreviewPanel title="Original reference">
              {job.originalPreviewUrl ? (
                <img
                  src={job.originalPreviewUrl}
                  alt="Original import reference"
                  className="max-h-[34rem] w-full rounded-[1.1rem] object-contain"
                />
              ) : (
                <EmptyPreview text="No screenshot reference was attached." />
              )}
            </PreviewPanel>
            <PreviewPanel title="Reconstructed preview">
              {job.renderedHtml ? (
                <iframe
                  title="Reconstructed email preview"
                  srcDoc={job.renderedHtml}
                  className="h-[34rem] w-full rounded-[1.1rem] border border-white/10 bg-white"
                />
              ) : (
                <EmptyPreview text={job.error ?? 'Preview is not available yet.'} />
              )}
            </PreviewPanel>
          </div>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-semibold tracking-tight">Recovered structure</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {recovered.length === 0 ? (
                <span className="text-sm text-zinc-500">No sections recovered.</span>
              ) : (
                recovered.map((kind, index) => (
                  <span
                    key={`${kind}-${index}`}
                    className="rounded-full border border-[#a7c957]/20 bg-[#a7c957]/10 px-3 py-1 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#d8ef9a]"
                  >
                    {kind}
                  </span>
                ))
              )}
            </div>
            <pre className="mt-5 max-h-[26rem] overflow-auto rounded-[1.2rem] border border-white/10 bg-zinc-950/80 p-4 text-xs leading-6 text-zinc-300">
              {JSON.stringify(job.intentAst ?? job.simplifiedDom ?? {}, null, 2)}
            </pre>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-semibold tracking-tight">Generated MJML</h2>
            <pre className="mt-5 max-h-[34rem] overflow-auto rounded-[1.2rem] border border-white/10 bg-zinc-950/80 p-4 text-xs leading-6 text-zinc-300">
              {job.mjml ?? 'MJML has not been compiled.'}
            </pre>
          </section>
        </div>

        <aside className="space-y-4">
          <ImportJobActions job={job} />

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-lg font-semibold tracking-tight">Diagnostics</h2>
            <div className="mt-4 space-y-3">
              {job.confidence ? (
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.05] p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {job.confidence.level} confidence
                  </div>
                  <div className="mt-2 font-mono text-4xl font-semibold tracking-tighter text-zinc-50">
                    {job.confidence.score}
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                    {job.confidence.reasons.map((reason) => (
                      <p key={reason}>{reason}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {job.warnings.length === 0 ? (
                <div className="text-sm leading-6 text-zinc-500">
                  No warnings were reported.
                </div>
              ) : (
                job.warnings.map((warning, index) => (
                  <div
                    key={`${warning.code}-${index}`}
                    className="rounded-[1rem] border border-white/10 bg-white/[0.05] p-4"
                  >
                    <div className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
                      {warning.severity} / {warning.code}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {warning.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] px-5 py-5 shadow-[0_20px_60px_-52px_rgba(0,0,0,0.85)]">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 break-words font-mono text-2xl font-semibold tracking-tight text-zinc-50">
        {value}
      </div>
    </div>
  );
}

function PreviewPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-5 min-h-[18rem] rounded-[1.2rem] border border-white/10 bg-zinc-950/60 p-3">
        {children}
      </div>
    </section>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return (
    <div className="grid min-h-[22rem] place-items-center rounded-[1rem] bg-white/[0.04] p-6 text-center text-sm leading-6 text-zinc-500">
      {text}
    </div>
  );
}
