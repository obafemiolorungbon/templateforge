'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { TemplateDetail, TemplateVariable } from '@templateforge/shared-types';
import { CaretDown, ClipboardText, Plus, X } from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const variableTypes = ['string', 'number', 'boolean', 'array', 'object'] as const;
const variablePattern = /^[a-z][a-z0-9_]*$/;

export function TemplateVariableEditor({
  template,
}: {
  template: TemplateDetail;
}) {
  const [variables, setVariables] = useState(template.variables);
  const [sampleVariables, setSampleVariables] = useState(template.sampleVariables);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    template.variables.findIndex((variable) => !isBrandVariable(variable.name)) >= 0
      ? template.variables.findIndex((variable) => !isBrandVariable(variable.name))
      : null,
  );
  const editableEntries = variables
    .map((variable, index) => ({ variable, index }))
    .filter(({ variable }) => !isBrandVariable(variable.name));
  const brandVariableCount = variables.length - editableEntries.length;

  const duplicateNames = useMemo(
    () =>
      variables
        .map((variable) => variable.name)
        .filter((name, index, names) => names.indexOf(name) !== index),
    [variables],
  );
  const invalidNames = variables
    .map((variable) => variable.name)
    .filter((name) => !variablePattern.test(name));
  const requiredCount = editableEntries.filter(
    ({ variable }) => variable.required,
  ).length;
  const error =
    duplicateNames.length > 0
      ? `Duplicate variables: ${[...new Set(duplicateNames)].join(', ')}`
      : invalidNames.length > 0
        ? `Invalid snake_case names: ${invalidNames.join(', ')}`
        : null;

  function addVariable() {
    const name = newName.trim();

    if (!name) {
      return;
    }

    const nextVariable: TemplateVariable = {
      name,
      type: 'string',
      required: true,
      description: `Value for {{${name}}}.`,
      example: sampleForName(name),
    };

    setVariables((items) => {
      setExpandedIndex(items.length);
      return [...items, nextVariable];
    });
    setSampleVariables((payload) => ({
      ...payload,
      [name]: payload[name] ?? nextVariable.example ?? '',
    }));
    setNewName('');
    setMessage(null);
  }

  function updateVariable(index: number, patch: Partial<TemplateVariable>) {
    setVariables((items) => {
      const before = items[index];
      const next = items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      );

      if (patch.name && patch.name !== before.name) {
        setSampleVariables((payload) => {
          const { [before.name]: oldValue, ...rest } = payload;
          return {
            ...rest,
            [patch.name as string]: oldValue ?? sampleForName(patch.name as string),
          };
        });
      }

      return next;
    });
  }

  function removeVariable(index: number) {
    const removed = variables[index];
    setVariables((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setSampleVariables((payload) => {
      const { [removed.name]: _removedValue, ...rest } = payload;
      return rest;
    });
    setExpandedIndex((current) => {
      if (current === index) return null;
      if (current !== null && current > index) return current - 1;
      return current;
    });
  }

  function updateExample(index: number, value: string) {
    const variable = variables[index];
    updateVariable(index, { example: value });
    setSampleVariables((payload) => ({
      ...payload,
      [variable.name]: value,
    }));
  }

  async function save() {
    if (error) {
      setMessage(error);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await api.updateTemplate(template.id, {
        variables,
        sampleVariables,
        changeNote: 'Updated variable contract',
      });
      setMessage('Variable contract saved.');
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Could not save variables.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
              Variables
            </h2>
            <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500">
              {editableEntries.length} email data
            </span>
          </div>
          <p className="mt-2 max-w-[58ch] text-sm leading-6 text-zinc-500">
            These are values your app passes when sending this email. Brand
            values come from Brand config and stay out of the template data flow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#a7c957] px-4 text-sm font-semibold text-zinc-950 transition hover:bg-[#98bb4f] active:translate-y-px"
        >
          <Plus size={17} weight="bold" />
          Manage variables
        </button>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-zinc-950/45 p-4">
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-zinc-500">
              Email placeholders
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              {requiredCount} required
              {brandVariableCount > 0
                ? `, ${brandVariableCount} brand values supplied automatically`
                : ''}
            </div>
          </div>
          <div className="text-xs text-zinc-600">Click to copy</div>
        </div>
        {editableEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
            No variables yet. Open the drawer to add the first one.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {editableEntries.slice(0, 6).map(({ variable }) => (
              <button
                key={variable.name}
                type="button"
                onClick={() => navigator.clipboard?.writeText(`{{${variable.name}}}`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#a7c957]/20 bg-[#a7c957]/10 px-2.5 py-1.5 font-mono text-[0.72rem] text-[#d8ef9a] transition hover:bg-[#a7c957]/[0.16] active:translate-y-px"
              >
                <ClipboardText size={14} />
                {'{{'}{variable.name}{'}}'}
              </button>
            ))}
            {editableEntries.length > 6 ? (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-500 transition hover:text-zinc-200"
              >
                +{editableEntries.length - 6} more
              </button>
            ) : null}
          </div>
        )}
      </div>

      <details className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/[0.035]">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-300">
          Sample payload
        </summary>
        <pre className="max-h-52 overflow-auto border-t border-white/10 p-4 text-xs leading-6 text-zinc-300">
          {JSON.stringify(sampleVariables, null, 2)}
        </pre>
      </details>

      {(message || error) ? (
        <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.055] p-3 text-sm text-zinc-300">
          {message ?? error}
        </div>
      ) : null}

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close variable editor"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-white/10 bg-[#0d0d10] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Variable contract
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
                    Manage template data
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100 active:translate-y-px"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addVariable();
                    }
                  }}
                  placeholder="transaction_reference"
                  className="input-dark rounded-xl"
                />
                <button
                  type="button"
                  onClick={addVariable}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] active:translate-y-px"
                >
                  <Plus size={16} weight="bold" />
                  Add variable
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {(message || error) ? (
                <div className="mb-4 rounded-[1rem] border border-white/10 bg-white/[0.055] p-3 text-sm text-zinc-300">
                  {message ?? error}
                </div>
              ) : null}

              {brandVariableCount > 0 ? (
                <div className="mb-4 rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-zinc-500">
                  {brandVariableCount} brand value
                  {brandVariableCount === 1 ? '' : 's'} are supplied from the
                  Brand page and hidden here to keep this contract focused on
                  send-time data.
                </div>
              ) : null}

              <div className="grid gap-3">
                {editableEntries.map(({ variable, index }) => {
                  const isExpanded = expandedIndex === index;

                  return (
                    <div
                      key={`${variable.name}-${index}`}
                      className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-zinc-950/55"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className="grid w-full gap-3 p-4 text-left transition hover:bg-white/[0.035] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="rounded-lg bg-[#a7c957]/10 px-2.5 py-1 font-mono text-xs text-[#d8ef9a]">
                              {'{{'}{variable.name || 'variable_name'}{'}}'}
                            </code>
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-500">
                              {variable.type}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                variable.required
                                  ? 'bg-[#a7c957]/15 text-[#d8ef9a]'
                                  : 'bg-white/[0.06] text-zinc-500'
                              }`}
                            >
                              {variable.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm text-zinc-500">
                            {variable.description || 'No description yet.'}
                          </p>
                        </div>
                        <CaretDown
                          size={18}
                          className={`text-zinc-500 transition ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isExpanded ? (
                        <div className="border-t border-white/10 p-4">
                          <div className="grid gap-3 lg:grid-cols-[minmax(160px,1fr)_140px_120px]">
                            <MiniField label="Name">
                              <input
                                value={variable.name}
                                onChange={(event) =>
                                  updateVariable(index, { name: event.target.value })
                                }
                                className="input-dark rounded-xl"
                                placeholder="amount"
                              />
                            </MiniField>
                            <MiniField label="Type">
                              <select
                                value={variable.type}
                                onChange={(event) =>
                                  updateVariable(index, {
                                    type: event.target.value as TemplateVariable['type'],
                                  })
                                }
                                className="input-dark rounded-xl"
                              >
                                {variableTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </MiniField>
                            <MiniField label="Required">
                              <button
                                type="button"
                                onClick={() =>
                                  updateVariable(index, {
                                    required: !variable.required,
                                  })
                                }
                                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition active:translate-y-px ${
                                  variable.required
                                    ? 'border-[#a7c957]/30 bg-[#a7c957]/15 text-[#d8ef9a]'
                                    : 'border-white/10 text-zinc-500 hover:text-zinc-200'
                                }`}
                              >
                                {variable.required ? 'Required' : 'Optional'}
                              </button>
                            </MiniField>
                          </div>

                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <MiniField label="Description">
                              <input
                                value={variable.description}
                                onChange={(event) =>
                                  updateVariable(index, {
                                    description: event.target.value,
                                  })
                                }
                                className="input-dark rounded-xl"
                              />
                            </MiniField>
                            <MiniField label="Example value">
                              <input
                                value={String(
                                  sampleVariables[variable.name] ??
                                    variable.example ??
                                    '',
                                )}
                                onChange={(event) =>
                                  updateExample(index, event.target.value)
                                }
                                className="input-dark rounded-xl"
                                placeholder="Example value"
                              />
                            </MiniField>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeVariable(index)}
                              className="min-h-10 rounded-xl border border-white/10 px-3 text-sm font-semibold text-zinc-500 transition hover:border-[#e06a57]/40 hover:text-[#e06a57] active:translate-y-px"
                            >
                              Remove variable
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#0d0d10]/[0.94] p-5">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="min-h-11 w-full rounded-xl bg-[#a7c957] px-4 text-sm font-semibold text-zinc-950 transition hover:bg-[#98bb4f] active:translate-y-px disabled:opacity-60"
              >
                {saving ? 'Saving variables' : 'Save variable contract'}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function MiniField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function sampleForName(name: string) {
  if (name.includes('url')) return 'https://app.example.com/action';
  if (name.includes('amount')) return 'NGN 45,700';
  if (name.includes('date')) return 'June 22, 2026';
  if (name.includes('name')) return 'Amaka';
  if (name.includes('reference')) return 'TF-84QK-19';
  return 'Example value';
}

function isBrandVariable(name: string) {
  return name.startsWith('brand_');
}
