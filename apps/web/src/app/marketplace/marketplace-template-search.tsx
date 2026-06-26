'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MarketplaceTemplateManifestItem } from '@templateforge/shared-types';

const iconButtonClass =
  'inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-zinc-300 transition duration-300 hover:border-[#a7c957]/35 hover:text-zinc-50 focus-visible:border-[#a7c957]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7c957]/20 active:translate-y-px';

const importIconButtonClass =
  'inline-flex size-11 items-center justify-center rounded-full bg-[#a7c957] text-zinc-950 transition duration-300 hover:bg-[#96b84c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7c957]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-px';

export function MarketplaceTemplateSearch({
  templates,
  importTemplateAction,
}: {
  templates: MarketplaceTemplateManifestItem[];
  importTemplateAction: (formData: FormData) => void | Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const suggestionOptions = useMemo(() => {
    const options = new Map<string, { label: string; type: string }>();
    const addOption = (label: string, type: string) => {
      const cleanLabel = label.trim();
      const key = cleanLabel.toLowerCase();

      if (!cleanLabel || options.has(key)) {
        return;
      }

      options.set(key, { label: cleanLabel, type });
    };

    templates.forEach((template) => {
      addOption(template.name, 'Template');
      addOption(template.category, 'Category');
      template.tags.forEach((tag) => addOption(tag, 'Tag'));
    });

    return [...options.values()].sort((first, second) =>
      first.label.localeCompare(second.label),
    );
  }, [templates]);
  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    const startsWithMatches: typeof suggestionOptions = [];
    const containsMatches: typeof suggestionOptions = [];

    suggestionOptions.forEach((option) => {
      const label = option.label.toLowerCase();

      if (label === normalizedQuery) {
        return;
      }

      if (label.startsWith(normalizedQuery)) {
        startsWithMatches.push(option);
        return;
      }

      if (label.includes(normalizedQuery)) {
        containsMatches.push(option);
      }
    });

    return [...startsWithMatches, ...containsMatches].slice(0, 7);
  }, [normalizedQuery, suggestionOptions]);
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

  const previewTemplate =
    templates.find((template) => template.id === previewId) ?? null;
  const showSuggestions =
    suggestionsOpen && normalizedQuery.length > 0 && suggestions.length > 0;

  function selectSuggestion(value: string) {
    setQuery(value);
    setSuggestionsOpen(false);
    searchInputRef.current?.focus();
  }

  function clearSearch() {
    setQuery('');
    setSuggestionsOpen(false);
    searchInputRef.current?.focus();
  }

  return (
    <section className="space-y-4">
      <div className="sticky top-0 z-30 -mx-1 bg-[#09090b]/82 px-1 py-2 backdrop-blur-xl">
        <div className="rounded-[1.65rem] border border-white/10 bg-[#111113]/92 p-3 shadow-[0_18px_58px_-38px_rgba(0,0,0,0.85)]">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div
              className="relative"
              onBlur={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setSuggestionsOpen(false);
                }
              }}
            >
              <label className="sr-only" htmlFor="marketplace-search">
                Search marketplace templates
              </label>
              <input
                id="marketplace-search"
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSuggestionsOpen(false);
                  }
                }}
                placeholder="Search by name, category, or tag..."
                className="input-dark pr-12"
              />
              {query ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear marketplace search"
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition duration-200 hover:bg-white/[0.07] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7c957]/25"
                >
                  <XIcon />
                </button>
              ) : null}
              {showSuggestions ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#111113] p-1 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.9)]">
                  {suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.type}-${suggestion.label}`}
                      type="button"
                      onClick={() => selectSuggestion(suggestion.label)}
                      className="grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[0.9rem] px-3 text-left transition duration-200 hover:bg-white/[0.065] focus-visible:bg-white/[0.065] focus-visible:outline-none"
                    >
                      <span className="truncate text-sm font-medium text-zinc-200">
                        {suggestion.label}
                      </span>
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-zinc-600">
                        {suggestion.type}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-full border border-white/10 bg-zinc-950/60 px-4 font-mono text-xs uppercase tracking-[0.16em] text-zinc-500 md:justify-center">
              <span>{filtered.length}</span>
              <span>shown</span>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="grid min-h-80 place-items-center rounded-[1.65rem] border border-white/10 bg-white/[0.045] p-8 text-center">
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
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-2 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.42)]">
          <div className="hidden grid-cols-[minmax(0,1fr)_9rem_8rem_10rem] gap-4 border-b border-white/10 px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-600 lg:grid">
            <div>Package</div>
            <div>Category</div>
            <div>Version</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-white/10">
            {filtered.map((template, index) => {
              const installed = Boolean(template.installedTemplateId);

              return (
                <article
                  key={`${template.id}@${template.version}`}
                  className="cascade-in grid gap-4 rounded-[1.35rem] px-4 py-4 transition duration-300 hover:bg-white/[0.055] lg:grid-cols-[minmax(0,1fr)_9rem_8rem_10rem] lg:items-center"
                  style={
                    { '--index': index } as CSSProperties &
                      Record<'--index', number>
                  }
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 lg:hidden">
                      <span className="rounded-full bg-[#a7c957]/15 px-2.5 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-[#c9e889]">
                        {template.category}
                      </span>
                      <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-zinc-500">
                        v{template.version}
                      </span>
                      {installed ? <InstalledBadge /> : null}
                    </div>
                    <div className="mt-2 flex min-w-0 items-center gap-2 lg:mt-0">
                      <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-100">
                        {template.name}
                      </h2>
                      {installed ? (
                        <span className="hidden lg:inline-flex">
                          <InstalledBadge />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-1 max-w-[74ch] text-sm leading-6 text-zinc-500">
                      {template.description}
                    </p>
                  </div>

                  <div className="hidden truncate font-mono text-xs uppercase tracking-[0.15em] text-[#c9e889] lg:block">
                    {template.category}
                  </div>
                  <div className="hidden font-mono text-xs uppercase tracking-[0.15em] text-zinc-500 lg:block">
                    v{template.version}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Tooltip label="Preview">
                      <button
                        type="button"
                        onClick={() => setPreviewId(template.id)}
                        aria-label={`Preview ${template.name}`}
                        className={iconButtonClass}
                      >
                        <EyeIcon />
                      </button>
                    </Tooltip>
                    <Tooltip label="Inspect package">
                      <Link
                        href={`/marketplace/${template.id}`}
                        aria-label={`Inspect ${template.name}`}
                        className={iconButtonClass}
                      >
                        <InspectIcon />
                      </Link>
                    </Tooltip>
                    {installed && template.installedTemplateId ? (
                      <Tooltip label="Open local">
                        <Link
                          href={`/templates/${template.installedTemplateId}`}
                          aria-label={`Open local template for ${template.name}`}
                          className={iconButtonClass}
                        >
                          <OpenIcon />
                        </Link>
                      </Tooltip>
                    ) : (
                      <Tooltip label="Import">
                        <form action={importTemplateAction}>
                          <input
                            type="hidden"
                            name="templateId"
                            value={template.id}
                          />
                          <button
                            type="submit"
                            aria-label={`Import ${template.name}`}
                            className={importIconButtonClass}
                          >
                            <ImportIcon />
                          </button>
                        </form>
                      </Tooltip>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <PreviewDrawer
        template={previewTemplate}
        importTemplateAction={importTemplateAction}
        onClose={() => setPreviewId(null)}
      />
    </section>
  );
}

function PreviewDrawer({
  template,
  importTemplateAction,
  onClose,
}: {
  template: MarketplaceTemplateManifestItem | null;
  importTemplateAction: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!template) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, template]);

  if (!template) {
    return null;
  }

  const installed = Boolean(template.installedTemplateId);

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/72 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-preview-title"
      onMouseDown={onClose}
    >
      <aside
        className="ml-auto flex h-dvh w-full max-w-[860px] flex-col border-l border-white/10 bg-[#0d0d10] shadow-[0_24px_90px_-42px_rgba(0,0,0,0.95)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 md:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#a7c957]/15 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#c9e889]">
                {template.category}
              </span>
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
                v{template.version}
              </span>
              {installed ? <InstalledBadge /> : null}
            </div>
            <h2
              id="marketplace-preview-title"
              className="mt-3 truncate text-2xl font-semibold tracking-tight text-zinc-50"
            >
              {template.name}
            </h2>
            <p className="mt-1 line-clamp-2 max-w-[70ch] text-sm leading-6 text-zinc-500">
              {template.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-300 transition duration-300 hover:border-white/20 hover:text-zinc-50 active:translate-y-px"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
          <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950">
            {template.preview ? (
              <img
                src={template.preview}
                alt={`${template.name} email preview`}
                className="mx-auto w-full max-w-[720px] bg-[#f4f4f5] object-contain"
              />
            ) : (
              <SyntheticTemplatePreview template={template} />
            )}
          </div>
        </div>

        <div className="grid gap-2 border-t border-white/10 p-4 sm:grid-cols-3 md:p-5">
          <Link
            href={`/marketplace/${template.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-200 transition duration-300 hover:border-[#a7c957]/35 hover:text-zinc-50 active:translate-y-px"
          >
            Inspect package
          </Link>
          {installed && template.installedTemplateId ? (
            <Link
              href={`/templates/${template.installedTemplateId}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/[0.08] px-5 text-sm font-semibold text-zinc-100 transition duration-300 hover:bg-white/[0.12] active:translate-y-px sm:col-span-2"
            >
              Open local template
            </Link>
          ) : (
            <form action={importTemplateAction} className="sm:col-span-2">
              <input type="hidden" name="templateId" value={template.id} />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px"
              >
                Import template
              </button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="pointer-events-none absolute bottom-full right-1/2 z-40 mb-2 hidden translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-100 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.9)] group-focus-within:block group-hover:block">
        {label}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function InspectIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M14 3v4a2 2 0 0 0 2 2h4" />
      <path d="M8.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8l6 6v3.5" />
      <circle cx="15" cy="16" r="3" />
      <path d="m17.4 18.4 2.1 2.1" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function InstalledBadge() {
  return (
    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-zinc-300">
      Installed
    </span>
  );
}

function SyntheticTemplatePreview({
  template,
}: {
  template: MarketplaceTemplateManifestItem;
}) {
  const firstTag = template.tags[0] ?? template.category;
  const secondTag = template.tags[1] ?? 'transactional';

  return (
    <div className="bg-[#eef2e8] p-6 text-[#111827] md:p-8">
      <div className="mx-auto max-w-[34rem]">
        <div className="pb-5 text-center font-mono text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#596272]">
          TemplateForge
        </div>
        <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-[0_24px_70px_-44px_rgba(17,24,39,0.65)]">
          <div className="bg-[#111827] px-7 py-8 text-white">
            <div className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#a7c957]">
              {template.category}
            </div>
            <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
              {template.name}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/72">
              {template.description}
            </p>
          </div>
          <div className="space-y-4 px-7 py-7">
            <div className="rounded-[1.1rem] bg-[#eff8df] px-5 py-4">
              <div className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#596272]">
                Sample contract
              </div>
              <div className="mt-2 truncate text-2xl font-semibold tracking-tight">
                {firstTag}
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <PreviewRow label="Package" value={`v${template.version}`} />
              <PreviewRow label="Type" value={secondTag} />
              <PreviewRow label="Action" value="Ready to import" />
            </div>
          </div>
        </div>
        <div className="px-5 py-5 text-center text-xs leading-5 text-[#596272]">
          Marketplace package preview. Inspect the package for MJML, text
          fallback, variables, and sample payload.
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-t border-[#d6decf] py-3">
      <div className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#596272]">
        {label}
      </div>
      <div className="truncate text-right font-semibold">{value}</div>
    </div>
  );
}
