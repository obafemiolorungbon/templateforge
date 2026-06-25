import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './global.css';
import { AppShell } from '../components/app-shell';
import { isDemoMode, isMarketplaceEnabled } from '../lib/features';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'TemplateForge',
  description:
    'Self-hosted AI workbench for provider-ready transactional email templates.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const marketplaceEnabled = isMarketplaceEnabled();
  const demoMode = isDemoMode();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppShell marketplaceEnabled={marketplaceEnabled} demoMode={demoMode}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
