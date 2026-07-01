'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileArrowDown,
  GearSix,
  Gauge,
  MagicWand,
  Palette,
  Question,
  StackSimple,
  Storefront,
} from '@phosphor-icons/react';

const navItems = [
  ['Dashboard', '/dashboard', Gauge, true, null],
  ['Templates', '/templates', StackSimple, true, null],
  ['Import', '/imports', FileArrowDown, true, 'Experimental'],
  ['Marketplace', '/marketplace', Storefront, false, null],
  ['Generate', '/templates/generate', MagicWand, true, null],
  ['Brand', '/brand', Palette, true, null],
  ['Settings', '/settings', GearSix, true, null],
  ['Help', '/help', Question, true, null],
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === '/templates') {
    return pathname === '/templates' || /^\/templates\/(?!generate(?:\/|$))/.test(pathname);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({
  marketplaceEnabled,
}: {
  marketplaceEnabled: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1">
      {navItems.map(([label, href, Icon, alwaysVisible, tag]) => {
        if (!alwaysVisible && !marketplaceEnabled) {
          return null;
        }

        const isActive = isActivePath(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex min-h-12 items-center gap-3 rounded-[1.15rem] border px-3 py-2.5 text-sm font-medium transition duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-[#a7c957]/70 active:translate-y-px ${
              isActive
                ? 'border-[#a7c957]/30 bg-[#a7c957] text-zinc-950 shadow-[0_18px_40px_-26px_rgba(167,201,87,0.85)]'
                : 'border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100'
            }`}
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-xl border transition ${
                isActive
                  ? 'border-zinc-950/10 bg-zinc-950/10'
                  : 'border-white/10 bg-white/[0.04] text-zinc-500 group-hover:text-zinc-100'
              }`}
            >
              <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
            </span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {tag ? (
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] ${
                  isActive
                    ? 'border-zinc-950/15 bg-zinc-950/10 text-zinc-950/75'
                    : 'border-[#a7c957]/20 bg-[#a7c957]/10 text-[#c9e889]'
                }`}
              >
                {tag}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
