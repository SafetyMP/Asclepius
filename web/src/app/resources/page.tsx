'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useJourney } from '@/components/workspace/journey-context';
import { ResourceExplorer } from '@/components/workspace/resource-explorer';
export default function ResourcesPage() {
  const { state, setState } = useJourney();
  return (
    <div className="workspace-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">THE BUILDING BLOCKS</p>
          <h1>Every record has a role.</h1>
          <p className="page-subtitle">
            Explore the people, events, and information behind Alex’s fictional visit.
          </p>
        </div>
        <span className="soft-pill">9 supported resource types</span>
      </div>
      <Link className="text-link context-return" href="/">
        <ArrowLeft size={16} />
        Back to care journey
      </Link>
      <ResourceExplorer
        context="explorer"
        initialType={state.explorerSelection ?? undefined}
        initialQuery={state.explorerQuery}
        onSelectionChange={(type) => setState((old) => ({ ...old, explorerSelection: type }))}
        onQueryChange={(query) => setState((old) => ({ ...old, explorerQuery: query }))}
      />
      <div className="bottom-note">
        These examples demonstrate the repository’s teaching subset. References connect sample
        records; no live systems are queried.
      </div>
    </div>
  );
}
