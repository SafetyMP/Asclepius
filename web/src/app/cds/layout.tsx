import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'cds/',
  'Local rule composition example · Asclepius',
  'A guide to local synthetic rule composition examples. Asclepius does not provide clinical decision support or medical advice.',
  false,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
