'use client';

import { useEffect, useState } from 'react';
import {
  ArrowsInSimple,
  Key,
  PencilSimple,
  ShieldCheck,
  X,
} from '@phosphor-icons/react';
import {
  clearDemoCredentials,
  maskDemoKey,
  readDemoCredentials,
  writeDemoCredentials,
} from '../lib/demo-credentials';

export function DemoCredentialToolbox() {
  const [mode, setMode] = useState<'wide' | 'expanded' | 'mini'>('wide');
  const emptyCredentials = {
    openRouterApiKey: '',
    cencoriApiKey: '',
    sendByteSandboxApiKey: '',
  };
  const [credentials, setCredentials] = useState(emptyCredentials);
  const [draft, setDraft] = useState(emptyCredentials);

  useEffect(() => {
    function sync() {
      const next = readDemoCredentials();
      setCredentials(next);
      setDraft(next);
    }

    window.addEventListener('templateforge-demo-credentials-change', sync);
    window.addEventListener('storage', sync);
    sync();

    return () => {
      window.removeEventListener('templateforge-demo-credentials-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const hasSendByteKey = Boolean(credentials.sendByteSandboxApiKey);
  const hasOpenRouterKey = Boolean(credentials.openRouterApiKey);
  const hasCencoriKey = Boolean(credentials.cencoriApiKey);
  const hasAiKey = hasOpenRouterKey || hasCencoriKey;
  const isMissingAnyKey = !hasSendByteKey || !hasAiKey;

  function save() {
    writeDemoCredentials(draft);
    setMode('wide');
  }

  function clear() {
    clearDemoCredentials();
    setMode('wide');
  }

  if (mode === 'mini') {
    return (
      <div className="fixed bottom-5 right-4 z-30 lg:bottom-8 lg:right-8">
        <button
          type="button"
          onClick={() => setMode('expanded')}
          aria-label="Open API keys"
          className={`grid h-14 w-14 place-items-center rounded-full bg-[#a7c957] text-zinc-950 shadow-[0_18px_54px_-30px_rgba(167,201,87,0.72)] transition hover:bg-[#96b84c] active:translate-y-px ${
            isMissingAnyKey ? 'breathing-dot ring-4 ring-[#a7c957]/18' : ''
          }`}
        >
          <Key size={21} weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-4 z-30 w-[min(23rem,calc(100vw-2rem))] lg:bottom-8 lg:right-8">
      {mode === 'expanded' ? (
        <div className="rounded-[1.4rem] border border-white/12 bg-[#111113]/95 p-4 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-zinc-500">
                API keys
              </div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-50">
                Connected keys
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('mini')}
                aria-label="Minimize API keys"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-50 active:translate-y-px"
              >
                <ArrowsInSimple size={16} />
              </button>
              <button
                type="button"
                onClick={() => setMode('wide')}
                aria-label="Close API keys form"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-50 active:translate-y-px"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <CredentialInput
              label="SendByte sandbox key"
              value={draft.sendByteSandboxApiKey}
              placeholder="sk_test_..."
              onChange={(sendByteSandboxApiKey) =>
                setDraft({ ...draft, sendByteSandboxApiKey })
              }
            />
            <CredentialInput
              label="OpenRouter key"
              value={draft.openRouterApiKey}
              placeholder="sk-or-..."
              onChange={(openRouterApiKey) =>
                setDraft({ ...draft, openRouterApiKey })
              }
            />
            <CredentialInput
              label="Cencori key"
              value={draft.cencoriApiKey}
              placeholder="csk_..."
              onChange={(cencoriApiKey) =>
                setDraft({ ...draft, cencoriApiKey })
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clear}
              className="min-h-10 rounded-full border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] active:translate-y-px"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={save}
              className="min-h-10 rounded-full bg-[#a7c957] px-4 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
            >
              Save keys
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex w-full items-center gap-3 rounded-full border border-white/12 bg-[#111113]/92 p-2 pr-2 text-left shadow-[0_18px_54px_-34px_rgba(0,0,0,0.75)] backdrop-blur-xl transition hover:border-[#a7c957]/35">
          <button
            type="button"
            onClick={() => setMode('expanded')}
            aria-label="Open API keys"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#a7c957] text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
          >
            <Key size={19} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => setMode('expanded')}
            className="min-w-0 flex-1 text-left active:translate-y-px"
          >
            <span className="block text-sm font-semibold text-zinc-50">
              API keys
            </span>
            <span className="mt-0.5 block truncate font-mono text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500">
              SendByte {hasSendByteKey ? 'set' : 'missing'} / AI{' '}
              {hasAiKey ? 'set' : 'missing'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('expanded')}
            aria-label="Edit API keys"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-[#a7c957] active:translate-y-px"
          >
            <PencilSimple size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMode('mini')}
            aria-label="Minimize API keys"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-[#a7c957] active:translate-y-px"
          >
            <ShieldCheck size={17} />
          </button>
        </div>
      )}
      {mode === 'wide' ? (
        <div className="pointer-events-none mt-2 hidden rounded-full bg-zinc-950/70 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-zinc-500 lg:block">
          {maskDemoKey(credentials.sendByteSandboxApiKey)}
        </div>
      ) : null}
    </div>
  );
}

function CredentialInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-100">{label}</span>
      <input
        type="password"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm text-zinc-100 outline-none transition focus:border-[#a7c957] focus:bg-white/[0.045] focus:ring-4 focus:ring-[#a7c957]/20"
      />
    </label>
  );
}
