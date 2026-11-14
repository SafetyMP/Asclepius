import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'auth/',
  'Local authentication example · Asclepius',
  'A guide to the separate local authentication teaching example. The public synthetic care demo needs no account or token.',
  false,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
