import { ResourceExplorer } from '@/components/workspace/resource-explorer';
export default function ResourcesPage() {
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
      <ResourceExplorer />
      <div className="bottom-note">
        These examples demonstrate the repository’s teaching subset. References connect sample
        records; no live systems are queried.
      </div>
    </div>
  );
}
