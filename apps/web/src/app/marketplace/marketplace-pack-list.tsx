'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import {
  ArrowLineDown,
  CheckCircle,
  Package,
  WarningCircle,
} from '@phosphor-icons/react';
import type { MarketplacePack } from '@templateforge/shared-types';
import { AppDrawer } from '../../components/app-drawer';
import { AppListRow } from '../../components/app-list-row';
import { StatusPill } from '../../components/status-pill';

export function MarketplacePackList({
  packs,
  unavailable,
  importPackAction,
}: {
  packs: MarketplacePack[];
  unavailable: string | null;
  importPackAction: (formData: FormData) => void | Promise<void>;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmOverwriteId, setConfirmOverwriteId] = useState<string | null>(
    null,
  );
  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === previewId) ?? null,
    [packs, previewId],
  );

  if (unavailable) {
    return (
      <section className="rounded-[1.5rem] border border-red-400/20 bg-red-500/[0.08] p-5">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-red-200/80">
          Packs unavailable
        </div>
        <p className="mt-3 text-sm leading-6 text-red-100/80">
          {unavailable}
        </p>
      </section>
    );
  }

  if (packs.length === 0) {
    return (
      <section className="grid min-h-80 place-items-center rounded-[1.65rem] border border-white/10 bg-white/[0.045] p-8 text-center">
        <div className="max-w-[34rem]">
          <span className="mx-auto grid size-14 place-items-center rounded-[1.15rem] border border-[#a7c957]/20 bg-[#a7c957]/10 text-[#d8ef9a]">
            <Package size={24} weight="bold" />
          </span>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-zinc-50">
            No marketplace packs yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Add a packs array to the marketplace manifest to offer curated
            starter sets beside individual templates.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-2 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.42)]">
        <div className="hidden grid-cols-[minmax(0,1fr)_8rem_9rem_8rem] gap-4 border-b border-white/10 px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-600 lg:grid">
          <div>Pack</div>
          <div>Templates</div>
          <div>Installed</div>
          <div className="text-right">Action</div>
        </div>

        <div className="divide-y divide-white/10">
          {packs.map((pack, index) => (
            <AppListRow
              as="article"
              key={pack.id}
              className="lg:grid-cols-[minmax(0,1fr)_8rem_9rem_8rem] lg:items-center"
              style={
                { '--index': index } as CSSProperties &
                  Record<'--index', number>
              }
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 lg:hidden">
                  <StatusPill tone="success">{pack.category}</StatusPill>
                  <StatusPill>{pack.totalCount} templates</StatusPill>
                  {pack.hasConflicts ? (
                    <StatusPill tone="warning">Installed</StatusPill>
                  ) : null}
                </div>
                <div className="mt-2 flex min-w-0 items-center gap-3 lg:mt-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#a7c957]/25 bg-[#a7c957]/10 text-[#d8ef9a]">
                    <Package size={17} weight="bold" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-100">
                      {pack.name}
                    </h2>
                    <p className="mt-1 line-clamp-1 max-w-[74ch] text-sm leading-6 text-zinc-500">
                      {pack.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <StatusPill>{pack.totalCount}</StatusPill>
              </div>
              <div className="hidden lg:block">
                <StatusPill tone={pack.hasConflicts ? 'warning' : 'muted'}>
                  {pack.installedCount}/{pack.totalCount}
                </StatusPill>
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewId(pack.id);
                    setConfirmOverwriteId(null);
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a7c957] px-4 text-sm font-semibold text-zinc-950 transition duration-300 hover:bg-[#96b84c] active:translate-y-px"
                >
                  <ArrowLineDown size={16} weight="bold" />
                  Install
                </button>
              </div>
            </AppListRow>
          ))}
        </div>
      </div>

      <PackDrawer
        pack={selectedPack}
        confirmOverwrite={confirmOverwriteId === selectedPack?.id}
        onAskOverwrite={() => setConfirmOverwriteId(selectedPack?.id ?? null)}
        onClose={() => {
          setPreviewId(null);
          setConfirmOverwriteId(null);
        }}
        importPackAction={importPackAction}
      />
    </section>
  );
}

function PackDrawer({
  pack,
  confirmOverwrite,
  onAskOverwrite,
  onClose,
  importPackAction,
}: {
  pack: MarketplacePack | null;
  confirmOverwrite: boolean;
  onAskOverwrite: () => void;
  onClose: () => void;
  importPackAction: (formData: FormData) => void | Promise<void>;
}) {
  if (!pack) {
    return null;
  }

  return (
    <AppDrawer
      open={Boolean(pack)}
      onClose={onClose}
      widthClassName="max-w-[860px]"
      title={pack.name}
      description={pack.description}
      headerAddon={
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">{pack.category}</StatusPill>
          <StatusPill>{pack.totalCount} templates</StatusPill>
          {pack.hasConflicts ? (
            <StatusPill tone="warning">
              {pack.installedCount} installed
            </StatusPill>
          ) : null}
        </div>
      }
      footer={
        <PackInstallActions
          pack={pack}
          confirmOverwrite={confirmOverwrite}
          onAskOverwrite={onAskOverwrite}
          importPackAction={importPackAction}
        />
      }
    >
      <div className="space-y-4">
        {pack.hasConflicts ? (
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-[1.2rem] border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
            <WarningCircle size={22} weight="bold" />
            <div>
              <div className="text-sm font-semibold">
                Some templates from this pack are already installed.
              </div>
              <p className="mt-1 text-sm leading-6 text-amber-100/75">
                Installing missing templates is non-destructive. Overwriting
                replaces the installed local copies with the current marketplace
                versions.
              </p>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950/55">
          <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3 border-b border-white/10 px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-600">
            <div>Included template</div>
            <div className="text-right">State</div>
          </div>
          <div className="divide-y divide-white/10">
            {pack.templates.map((template) => {
              const installed = Boolean(template.installedTemplateId);

              return (
                <div
                  key={template.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-100">
                      {template.name}
                    </div>
                    <div className="mt-1 truncate text-xs text-zinc-500">
                      {template.category} / v{template.version}
                    </div>
                  </div>
                  {installed ? (
                    <StatusPill tone="warning">Installed</StatusPill>
                  ) : (
                    <StatusPill tone="muted">New</StatusPill>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppDrawer>
  );
}

function PackInstallActions({
  pack,
  confirmOverwrite,
  onAskOverwrite,
  importPackAction,
}: {
  pack: MarketplacePack;
  confirmOverwrite: boolean;
  onAskOverwrite: () => void;
  importPackAction: (formData: FormData) => void | Promise<void>;
}) {
  if (!pack.hasConflicts) {
    return (
      <PackInstallForm
        packId={pack.id}
        overwrite={false}
        action={importPackAction}
        label="Install pack"
      />
    );
  }

  if (confirmOverwrite) {
    return (
      <div className="grid gap-3">
        <div className="rounded-[1rem] border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100/85">
          Confirm overwrite to replace existing local copies from this
          marketplace pack.
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <PackInstallForm
            packId={pack.id}
            overwrite={false}
            action={importPackAction}
            label="Install missing only"
            secondary
          />
          <PackInstallForm
            packId={pack.id}
            overwrite
            action={importPackAction}
            label="Confirm overwrite"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <PackInstallForm
        packId={pack.id}
        overwrite={false}
        action={importPackAction}
        label="Install missing only"
        secondary
      />
      <button
        type="button"
        onClick={onAskOverwrite}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a7c957] px-5 text-sm font-semibold text-zinc-950 transition hover:bg-[#96b84c] active:translate-y-px"
      >
        <WarningCircle size={16} weight="bold" />
        Overwrite installed
      </button>
    </div>
  );
}

function PackInstallForm({
  packId,
  overwrite,
  action,
  label,
  secondary,
}: {
  packId: string;
  overwrite: boolean;
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  secondary?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="packId" value={packId} />
      <input type="hidden" name="overwrite" value={String(overwrite)} />
      <button
        type="submit"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:translate-y-px ${
          secondary
            ? 'border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-[#a7c957]/35 hover:text-zinc-50'
            : 'bg-[#a7c957] text-zinc-950 hover:bg-[#96b84c]'
        }`}
      >
        {overwrite ? (
          <WarningCircle size={16} weight="bold" />
        ) : (
          <CheckCircle size={16} weight="bold" />
        )}
        {label}
      </button>
    </form>
  );
}
