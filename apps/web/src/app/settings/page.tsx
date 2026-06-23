import { api } from '../../lib/api';

export default async function SettingsPage() {
  const summary = await api.dashboard();
  const rows = [
    ['OPENROUTER_API_KEY', summary.env.openRouterConfigured ? 'Configured' : 'Missing'],
    ['OPENROUTER_MODEL', summary.env.openRouterModel],
  ];

  return (
    <div className="space-y-7">
      <header>
        <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
          Runtime settings
        </div>
        <h1 className="mt-3 max-w-[12ch] text-4xl font-semibold leading-none tracking-tighter text-zinc-50 md:text-6xl">
          Env-only secrets.
        </h1>
        <p className="mt-5 max-w-[62ch] text-base leading-7 text-zinc-400">
          V1 reads model and provider secrets from environment variables.
          Provider metadata is read-only here, and no secrets are stored in the database.
        </p>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.35)]">
        <div className="divide-y divide-white/10">
          {rows.map(([name, value]) => (
            <div
              key={name}
              className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[240px_minmax(0,1fr)]"
            >
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
                {name}
              </div>
              <div className="break-words text-sm font-medium text-zinc-100">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.35)]">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          Email providers
        </div>
        <div className="divide-y divide-white/10">
          {summary.env.providers.map((provider) => (
            <div
              key={provider.id}
              className="grid grid-cols-1 gap-3 py-5 lg:grid-cols-[220px_minmax(0,1fr)_160px]"
            >
              <div>
                <div className="font-semibold text-zinc-50">{provider.displayName}</div>
                <div className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
                  {provider.id}
                </div>
              </div>
              <div className="text-sm leading-6 text-zinc-400">
                {provider.warnings.length > 0
                  ? provider.warnings.join(' ')
                  : 'Provider is configured for template preview and deployment.'}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500 lg:text-right">
                {provider.configured ? provider.mode : 'Missing config'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {summary.env.warnings.length > 0 ? (
        <section className="rounded-[1.5rem] border border-[#d65f4a]/25 bg-[#d65f4a]/10 p-5">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
            Readiness notes
          </h2>
          <div className="mt-3 divide-y divide-[#d65f4a]/20">
            {summary.env.warnings.map((warning) => (
              <p key={warning} className="py-3 text-sm leading-6 text-zinc-300">
                {warning}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
