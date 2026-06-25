'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Key, ShieldCheck } from '@phosphor-icons/react';
import {
  readDemoCredentials,
  writeDemoCredentials,
} from '../../lib/demo-credentials';

export function DemoOnboardingForm() {
  const router = useRouter();
  const [sendByteSandboxApiKey, setSendByteSandboxApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readDemoCredentials();
    setSendByteSandboxApiKey(stored.sendByteSandboxApiKey);
    setOpenRouterApiKey(stored.openRouterApiKey);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const sendByteKey = sendByteSandboxApiKey.trim();
    if (!sendByteKey) {
      setError('SendByte sandbox API key is required for demo preview and deploy.');
      return;
    }

    if (!sendByteKey.startsWith('sk_test_')) {
      setError('Use a SendByte sandbox key that starts with sk_test_.');
      return;
    }

    writeDemoCredentials({
      sendByteSandboxApiKey: sendByteKey,
      openRouterApiKey: openRouterApiKey.trim(),
    });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-dvh px-4 py-5 md:px-8 md:py-8">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-400">
          TemplateForge
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-zinc-400 transition hover:text-zinc-50"
        >
          Skip to workbench
        </Link>
      </nav>

      <section className="mx-auto grid min-h-[calc(100dvh-6rem)] max-w-[1220px] grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[minmax(0,0.75fr)_minmax(420px,0.65fr)]">
        <div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a7c957] text-zinc-950">
            <Key size={21} weight="bold" />
          </div>
          <h1 className="mt-7 max-w-[12ch] text-5xl font-semibold leading-[0.94] tracking-tighter text-zinc-50 md:text-6xl">
            Connect your API keys.
          </h1>
          <p className="mt-6 max-w-[58ch] text-base leading-7 text-zinc-400">
            Add the keys needed to generate templates and render provider
            previews.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#a7c957]/12 text-[#a7c957]">
                <ShieldCheck size={18} weight="bold" />
              </span>
              <p className="text-sm leading-6 text-zinc-400">
                Your keys are kept in this browser session, sent only with the
                requests that need them, and cleared when the session ends or
                when you clear them from the toolbox.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-white/10 bg-[#111113]/90 p-5 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-7"
        >
          <div className="grid gap-5">
            <Field
              label="SendByte sandbox API key"
              helper="Required for provider preview and deploy. Use a sk_test_ key."
            >
              <input
                type="password"
                value={sendByteSandboxApiKey}
                onChange={(event) => setSendByteSandboxApiKey(event.target.value)}
                placeholder="sk_test_..."
                className="min-h-12 w-full rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm text-zinc-100 outline-none transition focus:border-[#a7c957] focus:bg-white/[0.045] focus:ring-4 focus:ring-[#a7c957]/20"
              />
            </Field>
            <Field
              label="OpenRouter API key"
              helper="Optional now. Required when you generate a new template."
            >
              <input
                type="password"
                value={openRouterApiKey}
                onChange={(event) => setOpenRouterApiKey(event.target.value)}
                placeholder="sk-or-..."
                className="min-h-12 w-full rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm text-zinc-100 outline-none transition focus:border-[#a7c957] focus:bg-white/[0.045] focus:ring-4 focus:ring-[#a7c957]/20"
              />
            </Field>
          </div>

          {error ? (
            <div className="mt-5 rounded-[1rem] border border-[#d65f4a]/30 bg-[#d65f4a]/10 p-3 text-sm leading-6 text-zinc-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
          >
            Continue to dashboard
            <ArrowRight size={16} weight="bold" />
          </button>
        </form>
      </section>
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
