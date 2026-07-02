import { AppListRow } from '../../components/app-list-row';
import { StatusPill } from '../../components/status-pill';
import { api } from '../../lib/api';

export default async function SettingsPage() {
  const summary = await api.dashboard();
  const rows = [
    ['TEMPLATEFORGE_AI_PROVIDER', summary.env.aiProviderDisplayName],
    [
      summary.env.aiApiKeyEnv,
      summary.env.aiConfigured ? 'Configured' : 'Missing',
    ],
    ['AI_MODEL', summary.env.aiModel],
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
          Provider metadata is read-only here, and no secrets are stored in the
          database.
        </p>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.35)]">
        <div className="divide-y divide-white/10">
          {rows.map(([name, value]) => (
            <AppListRow
              key={name}
              className="md:grid-cols-[240px_minmax(0,1fr)] md:items-center"
            >
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
                {name}
              </div>
              {name.endsWith('API_KEY') ? (
                <StatusPill
                  tone={value === 'Configured' ? 'success' : 'warning'}
                >
                  {value}
                </StatusPill>
              ) : (
                <div className="break-words text-sm font-medium text-zinc-100">
                  {value}
                </div>
              )}
            </AppListRow>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.35)]">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          Email providers
        </div>
        <div className="divide-y divide-white/10">
          {summary.env.providers.map((provider) => (
            <AppListRow
              key={provider.id}
              className="lg:grid-cols-[220px_minmax(0,1fr)_160px] lg:items-center"
            >
              <div>
                <div className="font-semibold text-zinc-50">
                  {provider.displayName}
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
                  {provider.id}
                </div>
              </div>
              <div className="text-sm leading-6 text-zinc-400">
                {provider.warnings.length > 0
                  ? provider.warnings.join(' ')
                  : 'Provider is configured for template preview and deployment.'}
              </div>
              <div className="lg:text-right">
                <StatusPill tone={provider.configured ? 'success' : 'warning'}>
                  {provider.configured ? provider.mode : 'Missing config'}
                </StatusPill>
              </div>
            </AppListRow>
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
