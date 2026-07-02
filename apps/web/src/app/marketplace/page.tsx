import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { api } from '../../lib/api';
import { isMarketplaceEnabled } from '../../lib/features';
import { MarketplaceBrowser } from './marketplace-browser';

export default async function MarketplacePage() {
  if (!isMarketplaceEnabled()) {
    notFound();
  }

  const manifest = await api.marketplaceTemplates().catch((error) => ({
    schemaVersion: 'unavailable',
    templates: [],
    error: error instanceof Error ? error.message : 'Marketplace unavailable.',
  }));
  const packManifest = await api.marketplacePacks().catch((error) => ({
    schemaVersion: 'unavailable',
    packs: [],
    error:
      error instanceof Error ? error.message : 'Marketplace packs unavailable.',
  }));

  const unavailable = 'error' in manifest ? manifest.error : null;
  const packUnavailable = 'error' in packManifest ? packManifest.error : null;

  async function importTemplate(formData: FormData) {
    'use server';

    const id = String(formData.get('templateId') ?? '');
    const imported = await api.importMarketplaceTemplate(id);
    redirect(`/templates/${imported.id}`);
  }

  async function importPack(formData: FormData) {
    'use server';

    const id = String(formData.get('packId') ?? '');
    const overwrite = String(formData.get('overwrite') ?? 'false') === 'true';
    await api.importMarketplacePack(id, { overwrite });
    redirect('/templates');
  }

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
            Central catalog
          </div>
          <h1 className="mt-3 max-w-[22ch] text-4xl font-semibold leading-[0.96] tracking-tighter text-zinc-50 md:text-5xl">
            Downloadable template packages.
          </h1>
          <p className="mt-3 max-w-[72ch] text-base leading-7 text-zinc-400">
            Browse public MJML packages, inspect their variables and sample
            payloads, then import a local copy into your TemplateForge library.
          </p>
        </div>
        <Link
          href="/templates"
          className="inline-flex min-h-11 items-center justify-center self-end rounded-full border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-zinc-100 transition duration-300 hover:border-[#a7c957]/40 hover:bg-white/[0.07] active:translate-y-px"
        >
          Local library
        </Link>
      </header>

      {unavailable ? (
        <section className="rounded-[1.5rem] border border-red-400/20 bg-red-500/[0.08] p-5">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-red-200/80">
            Marketplace unavailable
          </div>
          <p className="mt-3 text-sm leading-6 text-red-100/80">
            {unavailable}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Set TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL to your jsDelivr manifest
            URL after publishing the marketplace repo.
          </p>
        </section>
      ) : (
        <MarketplaceBrowser
          templates={manifest.templates}
          packs={packManifest.packs}
          packUnavailable={packUnavailable}
          importTemplateAction={importTemplate}
          importPackAction={importPack}
        />
      )}
    </div>
  );
}
