import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'resources/',
  'Resource explorer · Asclepius',
  'Explore the people, visits, referral, and handoff records in two fictional care journeys. Follow connections between synthetic FHIR resources.',
  true,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
