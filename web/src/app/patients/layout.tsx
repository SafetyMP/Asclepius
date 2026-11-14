import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'patients/',
  'Care journey compatibility link · Asclepius',
  'A compatibility route for the synthetic care journey. Explore the main Asclepius demo for two fictional cases.',
  false,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
