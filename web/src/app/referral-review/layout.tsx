import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  '',
  'Referral desk · Asclepius',
  'Reconcile incoming letters with two synthetic referrals and prepare an evidence-backed shift handoff.',
  false,
);

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
