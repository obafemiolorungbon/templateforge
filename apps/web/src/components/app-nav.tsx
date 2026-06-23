'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GearSix,
  Gauge,
  MagicWand,
  Palette,
  Question,
  StackSimple,
  Storefront,
} from '@phosphor-icons/react';

const navItems = [
  ['Dashboard', '/dashboard', Gauge, true],
  ['Templates', '/templates', StackSimple, true],
  ['Marketplace', '/marketplace', Storefront, false],
  ['Generate', '/templates/generate', MagicWand, true],
  ['Brand', '/brand', Palette, true],
  ['Settings', '/settings', GearSix, true],
  ['Help', '/help', Question, true],
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
      {navItems.map(([label, href, Icon, alwaysVisible]) => {
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
