import type { Metadata } from 'next';
import { pageMetadata, siteDescription, siteUrl } from '@/lib/site-metadata';
import { JourneyProvider } from '@/components/workspace/journey-context';
import { AppShell } from '@/components/layout/app-shell';
import { asclepiusNav } from '@/lib/navigation';
import './globals.css';

export const metadata: Metadata = {
  ...pageMetadata('', 'Referral desk · Asclepius', siteDescription),
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
        <JourneyProvider>
          <AppShell productName="Asclepius" eyebrow="THE CONNECTED CARE LAB" nav={asclepiusNav}>
            {children}
          </AppShell>
        </JourneyProvider>
      </body>
    </html>
  );
}
