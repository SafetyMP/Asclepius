import { sourceCodeSchema } from '@/lib/site-metadata';
import { ScenarioWorkspace } from '@/components/workspace/scenario-workspace';
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sourceCodeSchema).replace(/</g, '\\u003c'),
        }}
      />
      <ScenarioWorkspace />
    </>
  );
}
