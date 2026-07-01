'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ImportJob } from '@templateforge/shared-types';
import { api } from '../../../../lib/api';

export function ImportJobActions({ job }: { job: ImportJob }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<'confirm' | 'retry' | null>(null);

  async function confirm() {
    setBusy('confirm');
    setMessage(null);
    try {
      const result = await api.confirmImportJob(job.id);
      if (result.template) {
        router.push(`/templates/${result.template.id}`);
      } else {
        setMessage('Header and footer saved.');
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not confirm import.');
    } finally {
      setBusy(null);
    }
  }

  async function retry() {
    setBusy('retry');
    setMessage(null);
    try {
      await api.retryImportJob(job.id);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not retry import.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
      <h2 className="text-lg font-semibold tracking-tight">Actions</h2>
      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={busy !== null || job.status !== 'NEEDS_REVIEW'}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === 'confirm'
            ? 'Confirming'
            : job.mode === 'BRAND_SHELL'
              ? 'Save header and footer'
              : 'Save as template'}
        </button>
        <button
          type="button"
          onClick={retry}
          disabled={busy !== null}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-5 text-sm font-semibold text-zinc-200 transition duration-300 hover:border-white/20 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === 'retry' ? 'Retrying' : 'Retry reconstruction'}
        </button>
      </div>
      {message ? (
        <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.05] p-3 text-sm text-zinc-300">
          {message}
        </div>
      ) : null}
    </div>
  );
}
