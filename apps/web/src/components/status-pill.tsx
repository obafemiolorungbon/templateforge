import type { ReactNode } from 'react';

type StatusPillTone = 'success' | 'muted' | 'warning';

const toneClassNames: Record<StatusPillTone, string> = {
  success: 'border-[#a7c957]/20 bg-[#a7c957]/10 text-[#d8ef9a]',
  muted: 'border-white/10 bg-white/[0.055] text-zinc-500',
  warning: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
};

export function StatusPill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: StatusPillTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] ${toneClassNames[tone]}`}
    >
      {children}
    </span>
  );
}
