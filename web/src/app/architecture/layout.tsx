import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'architecture/',
  'How connected care works · Asclepius',
  'Understand the care journey, referral ownership, and FHIR concepts in plain language. Explore the local TypeScript teaching architecture when ready.',
  true,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
