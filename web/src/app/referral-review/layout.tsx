import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  '',
  'Referral review · Asclepius',
  'Match the consultant’s report to Maya’s referral and compare educational pilot choices and staff time.',
  false,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
