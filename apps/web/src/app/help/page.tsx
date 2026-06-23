const sections = [
  {
    title: 'Fresh install',
    body: 'TemplateForge V1 expects a new database. Run db:up, db:generate, db:reset, then dev for a clean local setup.',
    items: ['pnpm db:up', 'pnpm db:generate', 'pnpm db:reset', 'pnpm dev'],
  },
  {
    title: 'Providers',
    body: 'Provider metadata lives in the database, while secrets stay in environment variables. Settings shows readiness for configured providers.',
    items: [
      'TEMPLATEFORGE_SENDBYTE_API_KEY',
      'TEMPLATEFORGE_SENDBYTE_BASE_URL',
      'Use sandbox/test credentials first',
    ],
  },
  {
    title: 'Marketplace',
    body: 'Marketplace is optional and env-gated. When configured, imported templates become local copies in your library.',
    items: [
      'TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL',
      'Imports are not deployed automatically',
      'Missing URL hides Marketplace navigation',
    ],
  },
  {
    title: 'Troubleshooting',
    body: 'Most setup failures are environment, Docker, or Prisma client generation issues. Restart processes after changing env vars.',
    items: [
      'Stop Node processes if Prisma generate hits EPERM',
      'Start Docker before db:up',
      'Set OPENROUTER_API_KEY for generation',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-7">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
          Help
        </div>
        <h1 className="mt-3 max-w-[12ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
          Setup and release notes.
        </h1>
        <p className="mt-5 max-w-[68ch] text-base leading-7 text-zinc-400">
          TemplateForge V1 is a fresh-install public release. Use this page for
          local setup, provider readiness, marketplace configuration, and common
          troubleshooting steps.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.8)]"
          >
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{section.body}</p>
            <div className="mt-5 space-y-2">
              {section.items.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-zinc-950/55 px-3 py-2 font-mono text-xs text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-[#a7c957]/20 bg-[#a7c957]/10 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
          Public V1 expectation
        </h2>
        <p className="mt-3 max-w-[76ch] text-sm leading-6 text-zinc-300">
          Start from a fresh database for V1. Future releases will include
          upgrade notes when schema changes require action.
        </p>
      </section>
    </div>
  );
}
