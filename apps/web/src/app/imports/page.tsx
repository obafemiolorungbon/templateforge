import { ImportStartFlow } from './import-start-flow';
import { StepArrow } from './step-arrow';

const steps = [
  {
    number: '01',
    title: 'Add your header and footer',
    body: 'Upload a screenshot or paste the HTML for the parts every email reuses.',
  },
  {
    number: '02',
    title: 'Set your brand colors',
    body: 'Confirm the basics once so imported emails look like they belong to you.',
  },
  {
    number: '03',
    title: 'Import existing emails',
    body: 'Paste old HTML, upload screenshots, or provide both. TemplateForge rebuilds editable MJML.',
  },
];

export default function ImportsPage() {
  return (
    <div className="min-h-[calc(100dvh-4rem)]">
      <section className="grid min-h-[34rem] grid-cols-1 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_24px_70px_-48px_rgba(24,24,27,0.38)] lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="relative px-6 py-7 md:px-7 md:py-10 lg:px-8">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
              Import from another email tool
            </div>
            <h1 className="mt-5 max-w-[12ch] text-5xl font-semibold leading-[0.94] tracking-tighter text-zinc-50 md:text-7xl">
              Turn old email templates into editable MJML.
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-7 text-zinc-400">
              Bring over the emails you already use. Start with the header and
              footer, confirm your brand look, then convert each existing email
              with a clear preview before saving.
            </p>
          </div>

          <ImportStartFlow />
        </div>

        <aside className="border-t border-white/10 bg-[#171a13] p-6 lg:border-l lg:border-t-0 lg:p-8">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-50/45">
            What this saves you from
          </div>
          <div className="mt-8 space-y-5">
            <Relief
              title="No manual rebuild"
              body="Keep the structure of your existing emails without recreating every block by hand."
            />
            <Relief
              title="No blind conversion"
              body="Review what was recovered, what was approximated, and what needs a human check."
            />
            <Relief
              title="No repeated brand setup"
              body="Once the shared header and footer are saved, future imports focus on the email body."
            />
          </div>
        </aside>
      </section>

      <section className="mt-7 rounded-[2rem] border border-white/10 bg-zinc-950/35 p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {steps.map((step, index) => (
            <div key={step.number} className="contents">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#a7c957]">
                  {step.number}
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-50">
                  {step.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {step.body}
                </p>
              </div>
              {index < steps.length - 1 ? (
                <div className="hidden items-center px-1 text-[#a7c957] lg:flex">
                  <StepArrow />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Relief({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-white/10 pt-5">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-50">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
    </div>
  );
}
