import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'validate/',
  'Validation lab · Asclepius',
  'Try local structural checks on synthetic FHIR records and repair a sample. Eleven teaching schemas, not full FHIR conformance or clinical validation.',
  true,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
