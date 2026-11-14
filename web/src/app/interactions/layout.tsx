import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'interactions/',
  'Local interaction rule example · Asclepius',
  'A guide to an intentionally incomplete local drug interaction code example. Not a medication safety checker or clinical guidance.',
  false,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
