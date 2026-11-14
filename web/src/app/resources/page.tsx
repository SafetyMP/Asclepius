'use client';
import Link from 'next/link';
import { getJourney } from '@/lib/journeys';
import { JourneyPicker } from '@/components/workspace/journey-picker';
import { ArrowLeft } from 'lucide-react';
import { useJourney } from '@/components/workspace/journey-context';
import { ResourceExplorer } from '@/components/workspace/resource-explorer';
export default function ResourcesPage() {
  const { state, setState, journeyId } = useJourney();
  const journey = getJourney(journeyId);
  return (
    <div className="workspace-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">THE BUILDING BLOCKS</p>
          <h1>Every record has a role.</h1>
          <p className="page-subtitle">
            Explore the people, events, and information behind {journey.person}’s fictional journey.
          </p>
        </div>
        <span className="soft-pill">
          {journey.records.length} records ·{' '}
          {new Set(journey.records.map((record) => record.type)).size} resource types
        </span>
      </div>
      <JourneyPicker />
      <Link className="text-link context-return" href="/">
        <ArrowLeft size={16} />
        Back to care journey
      </Link>
      <ResourceExplorer
        key={journeyId}
        records={journey.records}
        journeyId={journeyId}
        person={journey.person}
        context="explorer"
        initialRecord={state.explorerSelection ?? undefined}
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
