import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  '',
  'Referral review · Asclepius',
  'Use three fictional FHIR records to review a referral handoff and weigh the staff time for a training pilot.',
  false,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
