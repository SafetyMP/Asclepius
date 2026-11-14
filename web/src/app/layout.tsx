import type { Metadata } from 'next';
import { JourneyProvider } from '@/components/workspace/journey-context';
import { AppShell } from '@/components/layout/app-shell';
import { asclepiusNav } from '@/lib/navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Asclepius · Connected care, explained',
  description:
    'Explore a fictional care journey and the FHIR resources that connect it. Synthetic educational demo. NOT FOR CLINICAL USE.',
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
