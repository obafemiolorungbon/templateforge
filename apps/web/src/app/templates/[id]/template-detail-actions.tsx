'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  BrandComponent,
  ProviderReadiness,
  TemplateDetail,
  TemplatePreview,
} from '@templateforge/shared-types';
import { api } from '../../../lib/api';
import { SelectField } from '../../../components/select-field';

export function TemplateDetailActions({
  template,
  brandComponents,
  providers,
}: {
  template: TemplateDetail;
  brandComponents: BrandComponent[];
  providers: ProviderReadiness[];
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSavingChrome, setIsSavingChrome] = useState(false);
  const selectableProviders = providers.filter((provider) => provider.enabled);
  const defaultProvider =
    selectableProviders.find((provider) => provider.isDefault) ?? selectableProviders[0];
  const [providerId, setProviderId] = useState(defaultProvider?.id ?? '');
  const selectedProvider = providers.find((provider) => provider.id === providerId);
  const [headerComponentId, setHeaderComponentId] = useState(
    template.headerComponent?.id ?? '',
  );
  const [footerComponentId, setFooterComponentId] = useState(
    template.footerComponent?.id ?? '',
  );
  const headerComponents = brandComponents.filter(
    (component) => component.type === 'HEADER',
  );
  const footerComponents = brandComponents.filter(
    (component) => component.type === 'FOOTER',
  );

  async function saveChrome() {
    setMessage(null);
    setIsSavingChrome(true);

    try {
      await api.updateTemplate(template.id, {
        headerComponentId: headerComponentId || null,
        footerComponentId: footerComponentId || null,
        changeNote: 'Updated reusable header/footer',
      });
      setMessage('Reusable header/footer saved as a new version.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reusable chrome update failed.');
    } finally {
      setIsSavingChrome(false);
    }
  }

  async function previewTemplate() {
    setMessage(null);
    setIsPreviewing(true);

    try {
      const result = await api.previewTemplate(template.id, providerId);
      setPreview(result);
      setMessage(result.warnings[0] ?? 'Preview rendered.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Preview failed.');
    } finally {
      setIsPreviewing(false);
    }
  }

  async function deployTemplate() {
    setMessage(null);
    setIsDeploying(true);

    try {
      const result = await api.deployTemplate(template.id, providerId, {
        mode: 'SANDBOX',
      });
      const providerName =
        providers.find((provider) => provider.id === result.provider)?.displayName ??
        'provider';
      setMessage(
        result.status === 'SUCCEEDED'
          ? `Deployed to ${providerName} as ${result.providerTemplateId ?? 'template'}.`
          : result.error ?? 'Template deployment failed.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Template deployment failed.');
    } finally {
      setIsDeploying(false);
    }
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
          Reusable email chrome
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <ChromeSelect
            label="Header"
            value={headerComponentId}
            components={headerComponents}
            onChange={setHeaderComponentId}
          />
          <ChromeSelect
            label="Footer"
            value={footerComponentId}
            components={footerComponents}
            onChange={setFooterComponentId}
          />
          <button
            type="button"
            onClick={saveChrome}
            disabled={isSavingChrome}
            className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] active:translate-y-px disabled:opacity-60"
          >
            {isSavingChrome ? 'Saving' : 'Save chrome'}
          </button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 lg:min-w-[320px]">
        <div className="mb-3">
          <SelectField
            label="Email provider"
            value={providerId}
            onChange={setProviderId}
            placeholder="No providers enabled"
            options={selectableProviders.map((provider) => ({
              value: provider.id,
              label: `${provider.displayName}${provider.isDefault ? ' (default)' : ''}`,
              detail: provider.configured
                ? `${provider.mode.toLowerCase()} deployment`
                : 'Local preview only',
            }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <button
            type="button"
            onClick={previewTemplate}
            disabled={isPreviewing || !providerId}
            className="min-h-11 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-100 transition duration-300 hover:bg-white/[0.07] active:translate-y-px disabled:opacity-60"
          >
            {isPreviewing ? 'Rendering preview' : 'Render preview'}
          </button>
          <button
            type="button"
            onClick={deployTemplate}
            disabled={isDeploying || !providerId || !selectedProvider?.configured}
            className="min-h-11 rounded-full bg-[#a7c957] px-4 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px disabled:opacity-60"
          >
            {isDeploying ? 'Deploying sandbox' : 'Deploy template'}
          </button>
        </div>
        {message ? (
          <div className="mt-4 rounded-[1rem] bg-white/[0.055] p-3 text-sm leading-6 text-zinc-400">
            {message}
          </div>
        ) : null}
      </div>

      {preview ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Rendered preview</h2>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              Provider render
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <iframe
              title="Rendered email preview"
              srcDoc={preview.html ?? ''}
              className="min-h-[420px] w-full rounded-[1.25rem] border border-white/10 bg-white/[0.045]"
            />
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[1.25rem] bg-white/[0.055] p-4 text-sm leading-6 text-zinc-300">
              {preview.text}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ChromeSelect({
  label,
  value,
  components,
  onChange,
}: {
  label: string;
  value: string;
  components: BrandComponent[];
  onChange: (value: string) => void;
}) {
  const options = [
    { value: '', label: `No ${label.toLowerCase()}` },
    ...components.map((component) => ({
      value: component.id,
      label: component.name,
      detail: component.isDefault ? 'Default' : undefined,
    })),
  ];

  return (
    <SelectField
      label={label}
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
