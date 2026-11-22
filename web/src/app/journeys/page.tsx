import { ScenarioWorkspace } from '@/components/workspace/scenario-workspace';
import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata(
  'journeys/',
  'Care journey · Asclepius',
  'Technical workspace for two fictional care journeys and their linked FHIR records.',
);

export default function Workspace() {
  return <ScenarioWorkspace />;
}
