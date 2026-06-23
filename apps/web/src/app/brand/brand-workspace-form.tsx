'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  BrandComponent,
  BrandComponentType,
  BrandWorkspace,
} from '@templateforge/shared-types';
import { SelectField } from '../../components/select-field';
import { api } from '../../lib/api';

const emptyComponent = (type: BrandComponentType) => ({
  name: type === 'HEADER' ? 'New header' : 'New footer',
  type,
  mjml:
    type === 'HEADER'
      ? '<mj-section padding="24px 32px 10px"><mj-column><mj-text font-size="13px" letter-spacing="2px" color="{{brand_primary_color}}" font-weight="700">{{brand_product_name}}</mj-text></mj-column></mj-section>'
      : '<mj-section padding="10px 32px 28px"><mj-column><mj-divider border-color="#E4E4E7" /><mj-text font-size="12px" color="#71717A">{{brand_footer_text}}</mj-text></mj-column></mj-section>',
  text: type === 'HEADER' ? '{{brand_product_name}}' : '{{brand_footer_text}}',
  isDefault: false,
});

export function BrandWorkspaceForm({
  initialWorkspace,
}: {
  initialWorkspace: BrandWorkspace;
}) {
  const [profile, setProfile] = useState(initialWorkspace.profile);
  const [components, setComponents] = useState(initialWorkspace.components);
  const [draft, setDraft] = useState(initialWorkspace.profile);
  const [componentDraft, setComponentDraft] = useState(emptyComponent('HEADER'));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const defaults = useMemo(
    () => ({
      header: components.find(
        (component) => component.type === 'HEADER' && component.isDefault,
      ),
      footer: components.find(
        (component) => component.type === 'FOOTER' && component.isDefault,
      ),
    }),
    [components],
  );

  async function saveProfile() {
    setSaving(true);
    setMessage(null);

    try {
      const updated = await api.updateBrandProfile(profile.id, {
        name: draft.name,
        productName: draft.productName,
        website: draft.website ?? '',
        logoUrl: draft.logoUrl ?? '',
        primaryColor: draft.primaryColor,
        accentColor: draft.accentColor,
        tone: draft.tone,
        footerText: draft.footerText ?? '',
      });
      setProfile(updated);
      setDraft(updated);
      setMessage('Brand profile saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save brand.');
    } finally {
      setSaving(false);
    }
  }

  async function createComponent() {
    setSaving(true);
    setMessage(null);

    try {
      const created = await api.createBrandComponent(profile.id, componentDraft);
      const next = componentDraft.isDefault
        ? components.map((item) =>
            item.type === created.type ? { ...item, isDefault: false } : item,
          )
        : components;
      setComponents([created, ...next]);
      setComponentDraft(emptyComponent(componentDraft.type));
      setMessage('Reusable component created.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not create component.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(component: BrandComponent) {
    setSaving(true);
    setMessage(null);

    try {
      const updated = await api.setDefaultBrandComponent(component.id);
      setComponents((items) =>
        items.map((item) =>
          item.type === updated.type
            ? { ...item, isDefault: item.id === updated.id }
            : item,
        ),
      );
      setMessage(`${updated.name} is now the default ${updated.type.toLowerCase()}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not update default.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveComponent(component: BrandComponent) {
    setSaving(true);
    setMessage(null);

    try {
      const updated = await api.updateBrandComponent(component.id, {
        name: component.name,
        type: component.type,
        mjml: component.mjml,
        text: component.text,
        isDefault: component.isDefault,
      });
      setComponents((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`${updated.name} saved.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save component.',
      );
    } finally {
      setSaving(false);
    }
  }

  function patchComponent(id: string, patch: Partial<BrandComponent>) {
    setComponents((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.75)] md:p-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Brand name">
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="input-dark" />
          </Field>
          <Field label="Product name">
            <input value={draft.productName} onChange={(event) => setDraft({ ...draft, productName: event.target.value })} className="input-dark" />
          </Field>
          <Field label="Website">
            <input value={draft.website ?? ''} onChange={(event) => setDraft({ ...draft, website: event.target.value })} className="input-dark" />
          </Field>
          <Field label="Logo URL">
            <input value={draft.logoUrl ?? ''} onChange={(event) => setDraft({ ...draft, logoUrl: event.target.value })} className="input-dark" />
          </Field>
          <Field label="Primary color">
            <input type="color" value={draft.primaryColor} onChange={(event) => setDraft({ ...draft, primaryColor: event.target.value })} className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-950 p-1" />
          </Field>
          <Field label="Accent color">
            <input type="color" value={draft.accentColor} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })} className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-950 p-1" />
          </Field>
          <Field label="Tone">
            <input value={draft.tone} onChange={(event) => setDraft({ ...draft, tone: event.target.value })} className="input-dark" />
          </Field>
          <Field label="Footer text">
            <textarea value={draft.footerText ?? ''} onChange={(event) => setDraft({ ...draft, footerText: event.target.value })} rows={3} className="textarea-dark min-h-24 px-4 py-3" />
          </Field>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={saveProfile}
          className="mt-6 min-h-11 rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition hover:bg-[#98bb4f] active:translate-y-px disabled:opacity-60"
        >
          Save brand profile
        </button>
        {message ? (
          <div className="mt-5 rounded-[1rem] border border-white/10 bg-white/[0.055] p-3 text-sm text-zinc-300">
            {message}
          </div>
        ) : null}
      </section>

      <aside className="rounded-[2rem] border border-white/10 bg-[#101014] p-5">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          Live brand preview
        </div>
        <div className="mt-5 overflow-hidden rounded-[1.5rem] bg-zinc-100 text-zinc-950">
          <div className="px-5 py-4" style={{ color: draft.primaryColor }}>
            <div className="text-xs font-bold uppercase tracking-[0.24em]">
              {draft.productName}
            </div>
          </div>
          <div className="px-5 py-6">
            <div className="text-2xl font-semibold tracking-tight">
              Branded transaction email
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{draft.tone}</p>
            <div className="mt-5 h-10 rounded-full" style={{ background: draft.primaryColor }} />
          </div>
          <div className="border-t border-zinc-200 px-5 py-4 text-xs leading-5 text-zinc-500">
            {draft.footerText}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Swatch label="Primary" value={draft.primaryColor} />
          <Swatch label="Accent" value={draft.accentColor} />
        </div>
      </aside>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 xl:col-span-2 md:p-7">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Reusable header/footer components
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {components.map((component) => (
                <div
                  key={component.id}
                  className="rounded-[1.4rem] border border-white/10 bg-zinc-950/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
                        {component.type}
                      </div>
                      <input
                        aria-label={`${component.type.toLowerCase()} component name`}
                        value={component.name}
                        onChange={(event) =>
                          patchComponent(component.id, { name: event.target.value })
                        }
                        className="mt-2 w-full border-0 bg-transparent p-0 text-lg font-semibold tracking-tight text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:text-[#d8f2a1]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDefault(component)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition active:translate-y-px ${
                        component.isDefault
                          ? 'bg-[#a7c957] text-zinc-950'
                          : 'border border-white/10 text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {component.isDefault ? 'Default' : 'Set default'}
                    </button>
                  </div>
                  <EditorField label="MJML source">
                    <textarea
                      value={component.mjml}
                      onChange={(event) =>
                        patchComponent(component.id, { mjml: event.target.value })
                      }
                      rows={7}
                      spellCheck={false}
                      className="textarea-dark code-textarea min-h-44 px-4 py-3 text-xs text-zinc-200"
                    />
                  </EditorField>
                  <EditorField label="Text fallback">
                    <textarea
                      value={component.text}
                      onChange={(event) =>
                        patchComponent(component.id, { text: event.target.value })
                      }
                      rows={3}
                      spellCheck={false}
                      className="textarea-dark min-h-24 px-4 py-3 text-sm leading-6 text-zinc-200"
                    />
                  </EditorField>
                  <button
                    type="button"
                    onClick={() => saveComponent(component)}
                    disabled={saving}
                    className="mt-3 min-h-10 rounded-full border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] active:translate-y-px disabled:opacity-60"
                  >
                    Save component
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/60 p-4">
            <h3 className="text-lg font-semibold text-zinc-100">Add component</h3>
            <div className="mt-4 grid gap-4">
              <SelectField
                label="Type"
                value={componentDraft.type}
                onChange={(value) =>
                  setComponentDraft(emptyComponent(value as BrandComponentType))
                }
                options={[
                  { value: 'HEADER', label: 'Header' },
                  { value: 'FOOTER', label: 'Footer' },
                ]}
              />
              <Field label="Name">
                <input value={componentDraft.name} onChange={(event) => setComponentDraft({ ...componentDraft, name: event.target.value })} className="input-dark" />
              </Field>
              <Field label="MJML">
                <textarea value={componentDraft.mjml} onChange={(event) => setComponentDraft({ ...componentDraft, mjml: event.target.value })} rows={6} spellCheck={false} className="textarea-dark code-textarea min-h-40 px-4 py-3 text-xs" />
              </Field>
              <Field label="Text fallback">
                <textarea value={componentDraft.text} onChange={(event) => setComponentDraft({ ...componentDraft, text: event.target.value })} rows={3} spellCheck={false} className="textarea-dark min-h-24 px-4 py-3" />
              </Field>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={componentDraft.isDefault}
                  onChange={(event) => setComponentDraft({ ...componentDraft, isDefault: event.target.checked })}
                  className="h-4 w-4 accent-[#a7c957]"
                />
                Make default {componentDraft.type.toLowerCase()}
              </label>
              <button
                type="button"
                onClick={createComponent}
                disabled={saving}
                className="min-h-11 rounded-full bg-zinc-100 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-white active:translate-y-px disabled:opacity-60"
              >
                Create reusable component
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <DefaultRow label="Default header" component={defaults.header} />
          <DefaultRow label="Default footer" component={defaults.footer} />
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      {children}
    </label>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-4 grid gap-2">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="h-9 rounded-xl" style={{ background: value }} />
      <div className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-zinc-300">{value}</div>
    </div>
  );
}

function DefaultRow({
  label,
  component,
}: {
  label: string;
  component?: BrandComponent;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-200">
        {component?.name ?? 'Not configured'}
      </div>
    </div>
  );
}
