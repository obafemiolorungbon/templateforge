'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ProviderReadiness,
  TemplateCodeSamples as TemplateCodeSamplesData,
} from '@templateforge/shared-types';
import { SelectField } from '../../../components/select-field';
import { AppDrawer } from '../../../components/app-drawer';
import { api } from '../../../lib/api';

export function TemplateCodeSamples({
  templateId,
  providers,
}: {
  templateId: string;
  providers: ProviderReadiness[];
}) {
  const selectableProviders = useMemo(
    () =>
      providers.filter(
        (provider) =>
          provider.enabled && provider.capabilities.includes('CODE_SAMPLES'),
      ),
    [providers],
  );
  const defaultProvider =
    selectableProviders.find((provider) => provider.isDefault) ??
    selectableProviders[0];
  const [isOpen, setIsOpen] = useState(false);
  const [providerId, setProviderId] = useState(defaultProvider?.id ?? '');
  const [samples, setSamples] = useState<TemplateCodeSamplesData | null>(null);
  const [activeSampleId, setActiveSampleId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [copiedSampleId, setCopiedSampleId] = useState<string | null>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => openButtonRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!providerId) {
      setSamples(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setMessage(null);

    api
      .templateCodeSamples(templateId, providerId)
      .then((nextSamples) => {
        if (cancelled) {
          return;
        }

        setSamples(nextSamples);
        setActiveSampleId(nextSamples.samples[0]?.id ?? '');
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setSamples(null);
        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : 'Code samples failed to load.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, providerId, templateId]);

  const activeSample =
    samples?.samples.find((sample) => sample.id === activeSampleId) ??
    samples?.samples[0] ??
    null;

  async function copySample() {
    if (!activeSample) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeSample.code);
      setCopiedSampleId(activeSample.id);
      window.setTimeout(() => setCopiedSampleId(null), 1400);
    } catch {
      setMessage('Clipboard access was blocked by the browser.');
    }
  }

  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
            Integration code
          </div>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-zinc-50">
            Send snippets
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Open copyable provider examples when you are ready to wire this
            template into an app.
          </p>
        </div>
        <span className="mt-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          Optional
        </span>
      </div>

      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={selectableProviders.length === 0}
        className="mt-4 min-h-11 w-full rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.075] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
      >
        Open code drawer
      </button>

      <AppDrawer
        open={isOpen}
        onClose={closeDrawer}
        widthClassName="max-w-[720px]"
        eyebrow="Integration code"
        title="Copyable send snippets"
        description="Provider-generated examples use this template's sample variables and saved provider template id when one exists."
        headerAddon={
          <div>
                <SelectField
                  label="Sample provider"
                  value={providerId}
                  onChange={setProviderId}
                  placeholder="No sample providers"
                  options={selectableProviders.map((provider) => ({
                    value: provider.id,
                    label: provider.displayName,
                    detail: provider.configured ? 'Configured' : 'Snippet only',
                  }))}
                />
          </div>
        }
      >
              {status === 'loading' ? (
                <div className="rounded-[1rem] border border-white/10 bg-zinc-950/40 p-4 font-mono text-sm text-zinc-500">
                  Loading provider snippets...
                </div>
              ) : null}

              {status === 'error' ? (
                <div className="rounded-[1rem] border border-[#e06a57]/30 bg-[#e06a57]/10 p-4 text-sm leading-6 text-[#f0a091]">
                  {message}
                </div>
              ) : null}

              {status === 'idle' ? (
                <div className="rounded-[1rem] border border-white/10 bg-zinc-950/40 p-4 text-sm leading-6 text-zinc-500">
                  No enabled provider exposes code samples yet.
                </div>
              ) : null}

              {samples && activeSample ? (
                <div className="space-y-4">
                  {samples.warnings.length > 0 ? (
                    <div className="rounded-[1rem] border border-[#a7c957]/25 bg-[#a7c957]/10 p-3 text-sm leading-6 text-[#d7e7a8]">
                      {samples.warnings[0]}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {samples.samples.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => setActiveSampleId(sample.id)}
                          className={[
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                            sample.id === activeSample.id
                              ? 'border-[#a7c957]/60 bg-[#a7c957] text-zinc-950'
                              : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-zinc-100',
                          ].join(' ')}
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={copySample}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.07] active:translate-y-px"
                      >
                        {copiedSampleId === activeSample.id ? 'Copied' : 'Copy code'}
                      </button>
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="rounded-full bg-[#a7c957] px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
                      >
                        Close drawer
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-zinc-950">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">
                          {activeSample.description}
                        </div>
                        {activeSample.installCommand ? (
                          <div className="mt-1 font-mono text-xs text-zinc-500">
                            {activeSample.installCommand}
                          </div>
                        ) : null}
                      </div>
                      <span className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-600">
                        {activeSample.language}
                      </span>
                    </div>
                    <pre className="max-h-[calc(100dvh-22rem)] overflow-auto p-4 text-sm leading-6 text-zinc-300">
                      <code>{activeSample.code}</code>
                    </pre>
                  </div>
                </div>
              ) : null}
      </AppDrawer>
    </section>
  );
}
