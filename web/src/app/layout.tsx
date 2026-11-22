import type { Metadata } from 'next';
import { pageMetadata, siteDescription, siteUrl } from '@/lib/site-metadata';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';

export const metadata: Metadata = {
  ...pageMetadata('', 'Referral review · Asclepius', siteDescription),
  metadataBase: new URL(siteUrl),
  applicationName: 'Asclepius',
  icons: { icon: new URL('icon.svg', siteUrl).href },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
