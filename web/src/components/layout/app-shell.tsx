'use client';
import Link from 'next/link';
import studyStyles from '@/app/referral-review/case.module.css';
import { useJourney } from '@/components/workspace/journey-context';
import { getJourney } from '@/lib/journeys';
import { useHydrated } from '@/lib/use-hydrated';
import { usePathname } from 'next/navigation';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Boxes,
  CheckCheck,
  GitBranch,
  Menu,
  PanelLeftClose,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { NavItem } from '@/lib/navigation';

const icons = [GitBranch, Boxes, CheckCheck, BookOpen];
export function AppShell({
  productName,
  eyebrow,
  nav,
  children,
}: {
  productName: string;
  eyebrow: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const { journeyId } = useJourney();
  const pathname = usePathname().replace(/\/$/, '') || '/';
  const [open, setOpen] = useState(false);
  if (pathname === '/' || pathname === '/referral-review') {
    return (
      <div className={studyStyles.studyShell}>
        <header className={studyStyles.masthead}>
          <Link href="/" className={studyStyles.wordmark}>
            <Activity size={24} aria-hidden />
            Asclepius
          </Link>
          <nav aria-label="Study navigation">
            <a href="#pilot-title">Educator worksheet</a>
            <Link href="/workspace">Technical workspace</Link>
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
    );
  }
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Asclepius home">
          <span className="brand-mark">
            <Activity size={24} strokeWidth={1.8} />
          </span>
          <span>
            {productName}
            <small>{eyebrow}</small>
          </span>
        </Link>
        <button
          className="mobile-menu icon-button"
          disabled={!hydrated}
          aria-expanded={open}
          aria-controls="sidebar-content"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <PanelLeftClose size={21} /> : <Menu size={21} />}
        </button>
        <div id="sidebar-content" className={`sidebar-content ${open ? 'is-open' : ''}`}>
          <Link href="/workspace" className="nav-caption">
            TECHNICAL WORKSPACE
          </Link>
          <nav aria-label="Primary">
            {nav.map((item, index) => {
              const Icon = icons[index] ?? BookOpen;
              const active =
                pathname === item.href || (item.href === '/journeys' && pathname === '/patients');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`nav-link ${active ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {index === 1 && (
                    <span className="nav-count">{getJourney(journeyId).records.length}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-note">
            <span className="mini-icon">
              <BookOpen size={18} />
            </span>
            <h3>A little context goes a long way.</h3>
            <p>See how everyday care becomes connected information.</p>
            <Link href="/architecture" onClick={() => setOpen(false)}>
              Explore the foundations <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="sidebar-footer">
            <a href="https://github.com/SafetyMP/Asclepius" target="_blank" rel="noreferrer">
              View project on GitHub <ArrowUpRight size={15} />
            </a>
            <span>
              <i className="status-dot" /> FHIR R4 teaching subset
            </span>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <span className="text-muted">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <span>
              {nav.find((item) => item.href === pathname)?.label ??
                (pathname === '/workspace' ? 'Technical workspace' : 'Learning notes')}
            </span>
          </div>
          <span className="demo-pill">
            <span className="status-dot" /> Interactive demo
          </span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="safety-footer">
          <ShieldCheck size={16} />
          <span>
            <strong>NOT FOR CLINICAL USE</strong> · Fictional records only. No real patient data.
            Educational subset, not a complete FHIR validator.
          </span>
          <span className="footer-local">Runs in your browser</span>
        </footer>
      </div>
    </div>
  );
}
