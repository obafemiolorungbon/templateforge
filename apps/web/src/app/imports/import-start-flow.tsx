'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Code,
  EnvelopeSimple,
  Palette,
  UploadSimple,
  X,
} from '@phosphor-icons/react';

const modalSteps = [
  {
    title: 'First, capture the repeated parts',
    body: 'Upload or paste the header and footer your emails already use. TemplateForge will preview them before saving.',
    icon: UploadSimple,
  },
  {
    title: 'Then confirm the visual basics',
    body: 'Pick the brand colors, logo, and button style that should carry across every imported email.',
    icon: Palette,
  },
  {
    title: 'Finally, convert each existing email',
    body: 'Paste the email HTML, add a screenshot if you have one, and review the MJML before it becomes a template.',
    icon: EnvelopeSimple,
  },
];

export function ImportStartFlow() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const current = modalSteps[step];
  const Icon = current.icon;

  return (
    <>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setIsOpen(true);
          }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a7c957] px-6 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px"
        >
          Start guided import
          <ArrowRight size={18} weight="bold" />
        </button>
        <Link
          href="/imports/body/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-6 text-sm font-semibold text-zinc-200 transition duration-300 hover:border-white/20 hover:bg-white/[0.08] active:translate-y-px"
        >
          I already added header and footer
        </Link>
      </div>

      <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
        <MiniPanel icon={UploadSimple} label="Header + footer" />
        <MiniPanel icon={Palette} label="Brand look" />
        <MiniPanel icon={Code} label="Editable MJML" />
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/78 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-flow-title"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111113] shadow-[0_40px_120px_-50px_rgba(0,0,0,0.95)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                Guided import
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close import guide"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-zinc-50 active:translate-y-px"
              >
                <X size={17} weight="bold" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-[5rem_minmax(0,1fr)]">
                <div className="grid h-20 w-20 place-items-center rounded-[1.4rem] border border-[#a7c957]/25 bg-[#a7c957]/12 text-[#d8ef9a]">
                  <Icon size={34} weight="duotone" />
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#a7c957]">
                    Step {step + 1} of {modalSteps.length}
                  </div>
                  <h2
                    id="import-flow-title"
                    className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-zinc-50"
                  >
                    {current.title}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-zinc-400">
                    {current.body}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-2">
                {modalSteps.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`h-2 rounded-full transition ${
                      index <= step ? 'bg-[#a7c957]' : 'bg-white/10'
                    }`}
                    aria-label={`Go to import step ${index + 1}`}
                  />
                ))}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </button>
                {step < modalSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
                  >
                    Continue
                    <ArrowRight size={17} weight="bold" />
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/imports/brand-shell/new"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
                    >
                      Add header and footer
                      <ArrowRight size={17} weight="bold" />
                    </Link>
                    <Link
                      href="/imports/body/new"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-5 text-sm font-semibold text-zinc-200 transition hover:border-white/20"
                    >
                      Skip to email import
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MiniPanel({
  icon: Icon,
  label,
}: {
  icon: typeof UploadSimple;
  label: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-[1.25rem] border border-white/10 bg-zinc-950/45 px-4">
      <span className="grid h-9 w-9 place-items-center text-[#d8ef9a]">
        <Icon size={18} weight="duotone" />
      </span>
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      <CheckCircle className="ml-auto text-zinc-600" size={17} weight="fill" />
    </div>
  );
}
