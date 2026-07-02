'use client';

import { useState } from 'react';
import type {
  MarketplacePack,
  MarketplaceTemplateManifestItem,
} from '@templateforge/shared-types';
import { MarketplacePackList } from './marketplace-pack-list';
import { MarketplaceTemplateSearch } from './marketplace-template-search';

type MarketplaceTab = 'templates' | 'packs';

export function MarketplaceBrowser({
  templates,
  packs,
  packUnavailable,
  importTemplateAction,
  importPackAction,
}: {
  templates: MarketplaceTemplateManifestItem[];
  packs: MarketplacePack[];
  packUnavailable: string | null;
  importTemplateAction: (formData: FormData) => void | Promise<void>;
  importPackAction: (formData: FormData) => void | Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('templates');

  return (
    <section className="space-y-5">
      <div className="inline-grid grid-cols-2 rounded-full border border-white/10 bg-zinc-950/70 p-1">
        <TabButton
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </TabButton>
        <TabButton
          active={activeTab === 'packs'}
          onClick={() => setActiveTab('packs')}
        >
          Packs
        </TabButton>
      </div>

      {activeTab === 'templates' ? (
        <MarketplaceTemplateSearch
          templates={templates}
          importTemplateAction={importTemplateAction}
        />
      ) : (
        <MarketplacePackList
          packs={packs}
          unavailable={packUnavailable}
          importPackAction={importPackAction}
        />
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 rounded-full px-5 text-sm font-semibold transition duration-300 active:translate-y-px ${
        active
          ? 'bg-[#a7c957] text-zinc-950'
          : 'text-zinc-400 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  );
}
