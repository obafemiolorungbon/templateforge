'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Code, ImageSquare } from '@phosphor-icons/react';
import type { BrandShell, ImportInput } from '@templateforge/shared-types';
import { api } from '../../lib/api';

type WizardKind = 'brand-shell' | 'body';

export function ImportWizard({
  kind,
  shells,
}: {
  kind: WizardKind;
  shells: BrandShell[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fullEmail = searchParams.get('mode') === 'full';
  const [form, setForm] = useState<ImportInput>({
    name: kind === 'brand-shell' ? 'Header and footer from old emails' : 'Imported receipt email',
    subject: 'Receipt for {{amount}}',
    category: 'receipt',
    html: '',
    headerHtml: '',
    footerHtml: '',
    brandShellId: shells[0]?.id,
    brandHints: {
      primaryColor: '#A7C957',
      backgroundColor: '#F4F4F5',
      textColor: '#18181B',
      emailWidth: 600,
      fontFamily: 'Arial',
    },
  });
  const [includeEmailHtml, setIncludeEmailHtml] = useState(false);
  const [includeHeaderHtml, setIncludeHeaderHtml] = useState(false);
  const [includeFooterHtml, setIncludeFooterHtml] = useState(false);
  const [assetMessage, setAssetMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (kind === 'brand-shell') {
      return Boolean(
        form.name &&
          (form.headerHtml ||
            form.footerHtml ||
            form.headerScreenshotAssetId ||
            form.footerScreenshotAssetId),
      );
    }
    return Boolean(form.name && (form.html || form.screenshotAssetId));
  }, [form, kind]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const job =
        kind === 'brand-shell'
          ? await api.importBrandShell(form)
          : fullEmail
            ? await api.importFullEmail(form)
            : await api.importBody(form);
      router.push(`/imports/jobs/${job.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Import could not be started.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function uploadReference(
    event: ChangeEvent<HTMLInputElement>,
    target:
      | 'screenshotAssetId'
      | 'headerScreenshotAssetId'
      | 'footerScreenshotAssetId',
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setAssetMessage('Registering screenshot asset...');
    try {
      const presigned = await api.presignUpload({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        assetType: target === 'screenshotAssetId' ? 'import-screenshot' : 'header-footer',
        visibility: 'PRIVATE',
      });
      setAssetMessage('Uploading screenshot to storage...');
      const isLocalFallback = presigned.uploadUrl.includes(
        'storage.templateforge.local',
      );
      const uploadMetadata: Record<string, unknown> = {
        filename: file.name,
        contentType: file.type,
      };
      let publicUrl = presigned.publicUrl ?? '';

      if (isLocalFallback) {
        publicUrl = await readFileAsDataUrl(file);
        uploadMetadata.localPreview = true;
      } else {
        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: presigned.method,
          headers: presigned.headers,
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error(`Storage upload failed with ${uploadResponse.status}.`);
        }
        uploadMetadata.storageUploaded = true;
        uploadMetadata.etag = uploadResponse.headers.get('etag');
      }

      await api.completeUpload({
        assetId: presigned.assetId,
        objectKey: presigned.objectKey,
        publicUrl,
        metadata: uploadMetadata,
      });
      setForm((current) => ({ ...current, [target]: presigned.assetId }));
      setAssetMessage(`${file.name} attached.`);
    } catch (uploadError) {
      setAssetMessage(
        uploadError instanceof Error
          ? uploadError.message
          : 'Screenshot upload failed.',
      );
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.35)] md:p-7">
        <div className="grid gap-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name this import" helper="A clear name helps you find it later.">
              <input
                value={form.name ?? ''}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="input-dark"
              />
            </Field>
            <Field label="Category" helper="Template library grouping.">
              <input
                value={form.category ?? 'transactional'}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="input-dark"
              />
            </Field>
          </div>

          {kind === 'body' ? (
            <>
              <Field label="Saved header and footer" helper="Choose the shared layout that should wrap this email.">
                <select
                  value={form.brandShellId ?? ''}
                  onChange={(event) =>
                    setForm({ ...form, brandShellId: event.target.value || undefined })
                  }
                  className="input-dark"
                >
                  <option value="">No saved header/footer yet</option>
                  {shells.map((shell) => (
                    <option key={shell.id} value={shell.id}>
                      {shell.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subject" helper="Required when saving the imported body.">
                <input
                  value={form.subject ?? ''}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className="input-dark"
                />
              </Field>
              <SourceChoice
                checked={includeEmailHtml}
                onChange={(checked) => {
                  setIncludeEmailHtml(checked);
                  if (!checked) {
                    setForm({ ...form, html: '' });
                  }
                }}
                title={fullEmail ? 'I have the full email HTML too' : 'I have the email HTML too'}
                body="Paste code only when you have it. Screenshot-only import will ask AI to rebuild the MJML from the image."
              />
              {includeEmailHtml ? (
                <Field
                  label={fullEmail ? 'Full email HTML' : 'Email HTML'}
                  helper="Paste the old template HTML from your current provider."
                >
                  <textarea
                    value={form.html ?? ''}
                    onChange={(event) => setForm({ ...form, html: event.target.value })}
                    rows={13}
                    className="textarea-dark code-textarea px-4 py-3 text-sm"
                  />
                </Field>
              ) : null}
              <FileField
                label="Reference screenshot"
                helper="Upload the visual reference. This can be used on its own."
                onChange={(event) => uploadReference(event, 'screenshotAssetId')}
              />
            </>
          ) : (
            <>
              <SourceChoice
                checked={includeHeaderHtml}
                onChange={(checked) => {
                  setIncludeHeaderHtml(checked);
                  if (!checked) {
                    setForm({ ...form, headerHtml: '' });
                  }
                }}
                title="I have header HTML too"
                body="Leave this off when you only have a header screenshot. AI will reconstruct the MJML from the image."
              />
              {includeHeaderHtml ? (
                <Field label="Header HTML" helper="Paste it if you have the code.">
                  <textarea
                    value={form.headerHtml ?? ''}
                    onChange={(event) => setForm({ ...form, headerHtml: event.target.value })}
                    rows={7}
                    className="textarea-dark code-textarea px-4 py-3 text-sm"
                  />
                </Field>
              ) : null}
              <FileField
                label="Header screenshot"
                helper="Upload what the header looks like in your current email tool."
                onChange={(event) => uploadReference(event, 'headerScreenshotAssetId')}
              />
              <SourceChoice
                checked={includeFooterHtml}
                onChange={(checked) => {
                  setIncludeFooterHtml(checked);
                  if (!checked) {
                    setForm({ ...form, footerHtml: '' });
                  }
                }}
                title="I have footer HTML too"
                body="Leave this off when the footer exists only as a screenshot."
              />
              {includeFooterHtml ? (
                <Field label="Footer HTML" helper="Paste it if you have the code.">
                  <textarea
                    value={form.footerHtml ?? ''}
                    onChange={(event) => setForm({ ...form, footerHtml: event.target.value })}
                    rows={7}
                    className="textarea-dark code-textarea px-4 py-3 text-sm"
                  />
                </Field>
              ) : null}
              <FileField
                label="Footer screenshot"
                helper="Upload the legal footer, unsubscribe area, and contact details."
                onChange={(event) => uploadReference(event, 'footerScreenshotAssetId')}
              />
            </>
          )}
        </div>

        {error ? (
          <div className="mt-5 rounded-[1.2rem] border border-[#d65f4a]/30 bg-[#d65f4a]/10 p-4 text-sm leading-6 text-zinc-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Preparing preview' : 'Preview converted MJML'}
        </button>
      </section>

      <aside className="space-y-4">
        <Panel title="Brand look">
          <div className="grid gap-4">
            <ColorPicker
              label="Primary color"
              value={form.brandHints?.primaryColor ?? '#A7C957'}
              onChange={(primaryColor) =>
                setForm({ ...form, brandHints: { ...form.brandHints, primaryColor } })
              }
            />
            <ColorPicker
              label="Email background"
              value={form.brandHints?.backgroundColor ?? '#F4F4F5'}
              onChange={(backgroundColor) =>
                setForm({ ...form, brandHints: { ...form.brandHints, backgroundColor } })
              }
            />
            <ColorPicker
              label="Text color"
              value={form.brandHints?.textColor ?? '#18181B'}
              onChange={(textColor) =>
                setForm({ ...form, brandHints: { ...form.brandHints, textColor } })
              }
            />
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-100">Font family</span>
              <select
                value={form.brandHints?.fontFamily ?? 'Arial'}
                onChange={(event) =>
                  setForm({
                    ...form,
                    brandHints: { ...form.brandHints, fontFamily: event.target.value },
                  })
                }
                className="input-dark"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
              </select>
            </label>
          </div>
        </Panel>

        <Panel title="What happens next">
          <div className="space-y-3 text-sm leading-6 text-zinc-400">
            <p>TemplateForge rebuilds the layout, then shows you a preview before anything is saved.</p>
            <p>No email is deployed from this flow. You stay in control of what becomes a template.</p>
            {assetMessage ? (
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.05] p-3 text-zinc-300">
                {assetMessage}
              </div>
            ) : null}
          </div>
        </Panel>
      </aside>
    </form>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-100">{label}</span>
      {children}
      <span className="text-xs leading-5 text-zinc-500">{helper}</span>
    </label>
  );
}

function FileField({
  label,
  helper,
  onChange,
}: {
  label: string;
  helper: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-100">{label}</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onChange}
        className="block w-full rounded-[1.1rem] border border-white/10 bg-white/[0.055] px-3 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#a7c957] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950"
      />
      <span className="text-xs leading-5 text-zinc-500">{helper}</span>
    </label>
  );
}

function SourceChoice({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <label className="group grid cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)_1.75rem] items-center gap-3 rounded-[1.15rem] border border-white/10 bg-zinc-950/45 p-3 transition hover:border-[#a7c957]/35 hover:bg-white/[0.055]">
      <span className="grid h-11 w-11 place-items-center text-[#d8ef9a]">
        {checked ? <Code size={22} weight="duotone" /> : <ImageSquare size={22} weight="duotone" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-zinc-100">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{body}</span>
      </span>
      <span className="relative grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-white/[0.04] transition group-hover:border-[#a7c957]/45">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {checked ? <Check size={16} weight="bold" className="text-[#a7c957]" /> : null}
      </span>
    </label>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#A7C957';

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-100">{label}</span>
      <div className="grid min-h-12 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-full border border-white/10 bg-zinc-950/70 p-1.5 transition focus-within:border-[#a7c957]/70 focus-within:ring-4 focus-within:ring-[#a7c957]/20">
        <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-white/10">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: safeValue }}
            aria-hidden="true"
          />
          <input
            type="color"
            value={safeValue}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            aria-label={label}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-9 min-w-0 bg-transparent px-2 font-mono text-sm text-zinc-100 outline-none"
          placeholder="#A7C957"
        />
      </div>
    </label>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(file);
  });
}
