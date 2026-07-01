'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';

export function ImportBackLink() {
  return (
    <Link
      href="/imports"
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-300 transition duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-zinc-50 active:translate-y-px"
    >
      <ArrowLeft size={17} weight="bold" aria-hidden="true" />
      Import overview
    </Link>
  );
}
