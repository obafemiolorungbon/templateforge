'use client';

import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { SelectField } from '../../../components/select-field';
import { api } from '../../../lib/api';

const categoryOptions = [
  { value: 'receipt', label: 'Receipt', detail: 'Payment or wallet confirmation' },
  { value: 'otp', label: 'OTP', detail: 'One-time passcode or verification' },
  { value: 'password-reset', label: 'Password reset', detail: 'Security recovery flow' },
  { value: 'payment-failed', label: 'Payment failed', detail: 'Failed billing or charge notice' },
  { value: 'invoice', label: 'Invoice', detail: 'Invoice delivery or reminder' },
  { value: 'account-alert', label: 'Account alert', detail: 'Security or account activity' },
  { value: 'welcome', label: 'Welcome', detail: 'New user onboarding' },
  { value: 'onboarding', label: 'Onboarding', detail: 'Activation or first action' },
  { value: 'trial-ending', label: 'Trial ending', detail: 'Trial expiry reminder' },
  { value: 'winback', label: 'Winback', detail: 'Re-engage inactive users' },
  { value: 'product-announcement', label: 'Product announcement', detail: 'Launch or feature news' },
  { value: 'newsletter', label: 'Newsletter', detail: 'Editorial or digest email' },
  { value: 'support-update', label: 'Support update', detail: 'Ticket, refund, or issue status' },
  { value: 'demo-reminder', label: 'Demo reminder', detail: 'Sales or meeting follow-up' },
  { value: 'internal-update', label: 'Internal update', detail: 'Team or business notification' },
];

const defaults = {
  useCase:
    'Send a receipt after a successful wallet top-up with amount, reference, and dashboard link.',
  productName: 'PayLink Ledger',
  audience: 'Developers integrating payment workflows for African SMEs',
  tone: 'clear, calm, practical',
  category: 'receipt',
  variableHints: 'first_name, amount, reference, dashboard_url',
};

export function GenerateTemplateForm() {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const variableHints = useMemo(
    () =>
      form.variableHints
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [form.variableHints],
  );

  function setVariableHints(nextHints: string[]) {
    setForm({ ...form, variableHints: nextHints.join(', ') });
  }

  function addVariableHint(value: string) {
    const normalized = value.trim();

    if (!normalized || variableHints.includes(normalized)) {
      return;
    }

    setVariableHints([...variableHints, normalized]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await api.generateTemplate(form);
      router.push(`/templates/${result.template.id}`);
      router.refresh();
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Template generation failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.35)] md:p-7"
    >
      <div className="grid gap-5">
        <Field label="Use case" helper="Concrete event and recipient context.">
          <textarea
            value={form.useCase}
            onChange={(event) => setForm({ ...form, useCase: event.target.value })}
            rows={5}
            className="min-h-32 w-full rounded-[1.2rem] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#a7c957] focus:bg-white/[0.045] focus:ring-4 focus:ring-[#a7c957]/20"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Product" helper="Brand or app name.">
            <input
              value={form.productName}
              onChange={(event) => setForm({ ...form, productName: event.target.value })}
              className="min-h-11 w-full rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm outline-none transition focus:border-[#a7c957] focus:bg-white/[0.045] focus:ring-4 focus:ring-[#a7c957]/20"
            />
          </Field>
          <div>
            <SelectField
              label="Category"
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
              options={categoryOptions}
              helper="Choose the closest email pattern so copy and UI are shaped correctly."
            />
          </div>
        </div>
        <Field label="Audience" helper="Who receives or implements this email.">
          <input
            value={form.audience}
            onChange={(event) => setForm({ ...form, audience: event.target.value })}
            className="min-h-11 w-full rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm outline-none transition focus:border-[#a7c957] focus:bg-white/[0.045] focus:ring-4 focus:ring-[#a7c957]/20"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tone" helper="Style guardrail for copy.">
            <input
              value={form.tone}
              onChange={(event) => setForm({ ...form, tone: event.target.value })}
              className="min-h-11 w-full rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm outline-none transition focus:border-[#a7c957] focus:bg-white/[0.045] focus:ring-4 focus:ring-[#a7c957]/20"
            />
          </Field>
          <Field label="Variables" helper="Names the AI should plan for. Press Enter to add one.">
            <VariableHintInput
              hints={variableHints}
              onAdd={addVariableHint}
              onRemove={(hint) =>
                setVariableHints(variableHints.filter((item) => item !== hint))
              }
            />
          </Field>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[1.2rem] border border-[#d65f4a]/30 bg-[#d65f4a]/10 p-4 text-sm leading-6 text-zinc-200">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-zinc-50 transition duration-300 hover:bg-zinc-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Generating validated draft' : 'Generate MJML template'}
      </button>
    </form>
  );
}

function VariableHintInput({
  hints,
  onAdd,
  onRemove,
}: {
  hints: string[];
  onAdd: (hint: string) => void;
  onRemove: (hint: string) => void;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    onAdd(draft);
    setDraft('');
  }

  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.055] p-2">
      <div className="flex flex-wrap gap-2">
        {hints.map((hint) => (
          <button
            key={hint}
            type="button"
            onClick={() => onRemove(hint)}
            title="Remove variable"
            className="rounded-lg border border-[#a7c957]/20 bg-[#a7c957]/10 px-2.5 py-1 font-mono text-[0.72rem] text-[#d8ef9a] transition hover:border-[#e06a57]/35 hover:text-[#e06a57] active:translate-y-px"
          >
            {hint}
          </button>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              commit();
            }
          }}
          placeholder="amount"
          className="min-h-8 min-w-28 flex-1 bg-transparent px-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </div>
    </div>
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
