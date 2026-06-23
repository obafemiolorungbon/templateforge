import { GenerateTemplateForm } from './template-generate-form';

export default function GenerateTemplatePage() {
  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,0.88fr)_minmax(380px,0.62fr)]">
      <section>
        <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
          AI generation
        </div>
        <h1 className="mt-3 max-w-[12ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
          Describe the email contract.
        </h1>
        <p className="mt-5 max-w-[58ch] text-base leading-7 text-zinc-400">
          TemplateForge asks OpenRouter for MJML, text fallback, variables, and
          sample payloads. The backend validates Handlebars syntax rules before
          saving the draft.
        </p>
      </section>
      <GenerateTemplateForm />
    </div>
  );
}
