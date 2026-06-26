'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { MarketplaceTemplateManifestItem } from '@templateforge/shared-types';

export function MarketplaceTemplateSearch({
  templates,
}: {
  templates: MarketplaceTemplateManifestItem[];
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) {
      return templates;
    }

    return templates.filter((template) =>
      [
        template.name,
        template.description,
        template.category,
        template.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery, templates]);

  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3">
        <label className="sr-only" htmlFor="marketplace-search">
          Search marketplace templates
        </label>
        <input
          id="marketplace-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, category, or tag..."
          className="min-h-12 w-full rounded-[1.1rem] border border-white/10 bg-zinc-950/70 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#a7c957]/60 focus:ring-2 focus:ring-[#a7c957]/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="grid min-h-60 place-items-center rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-8 text-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
              No templates matched
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Try a category like auth, receipt, onboarding, or security.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((template) => (
            <Link
              key={`${template.id}@${template.version}`}
              href={`/marketplace/${template.id}`}
              className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.045] transition duration-300 hover:-translate-y-0.5 hover:border-[#a7c957]/35 hover:bg-white/[0.07]"
            >
              {template.preview ? (
                <div className="aspect-[4/3] overflow-hidden border-b border-white/10 bg-zinc-950">
                  <img
                    src={template.preview}
                    alt={`${template.name} email preview`}
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.015]"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#a7c957]/15 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#c9e889]">
                    {template.category}
                  </span>
                  <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
                    v{template.version}
                  </span>
                  {template.installedTemplateId ? (
                    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-300">
                      Installed
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">
                  {template.name}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                  {template.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {template.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500 transition group-hover:text-[#a7c957]">
                  Inspect package
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
