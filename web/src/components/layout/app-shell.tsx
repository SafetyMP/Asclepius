'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ShieldCheck } from 'lucide-react';
import { StudyProvider } from '@/app/referral-review/shift';
import styles from '@/app/referral-review/case.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname().replace(/\/$/, '');
  const study = path === '' || path === '/referral-review';
  return (
    <StudyProvider>
      <div className={styles.studyShell}>
        <header className={styles.masthead}>
          <Link href="/" className={styles.wordmark}>
            <Activity size={24} aria-hidden /> Asclepius
          </Link>
          <nav aria-label="Study navigation">
            <Link href="/" aria-current={study ? 'page' : undefined}>
              Referral study
            </Link>
            {study && <a href="#pilot-title">Educator worksheet</a>}
            <Link href="/workspace" aria-current={study ? undefined : 'page'}>
              Technical evidence
            </Link>
          </nav>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="safety-footer">
          <ShieldCheck size={16} aria-hidden />
          <span>
            <strong>NOT FOR CLINICAL USE</strong> · Fictional teaching records only.
          </span>
        </footer>
      </div>
    </StudyProvider>
  );
}
