import Link from 'next/link';
import { pageMetadata } from '@/lib/site-metadata';
import styles from '../referral-review/case.module.css';

export const metadata = pageMetadata(
  'workspace/',
  'Technical reference · Asclepius',
  'Trace the static referral desk, synthetic resource identities, shared validation service and separate local API to their TypeScript sources.',
);
const source =
  'https://github.com/SafetyMP/Asclepius/blob/380318989af431eddf8efa01e2234141d73a56c3/';
const components = [
  [
    'Record identity',
    'The referral fixture links the request, coordination task and planned encounter by ResourceType/id.',
    'web/src/lib/referral-examples.ts',
  ],
  [
    'Desk state',
    'The register stores local filing decisions separately from the immutable FHIR snapshot. Reloading clears the practice shift.',
    'web/src/app/referral-review/shift.tsx',
  ],
  [
    'Teaching validation',
    'The shared Zod parser and three profile rules return an OperationOutcome for eleven supported R4 resource types.',
    'src/service/validation/service.ts',
  ],
  [
    'Local API',
    'The Hono composition root wires service ports to memory or SQLite adapters. The exported Pages demo needs no API or credentials.',
    'src/app.ts',
  ],
] as const;
export default function Workspace() {
  return (
    <article className={styles.guide}>
      <p className={styles.kicker}>Asclepius · Implementation notes</p>
      <h1>Technical reference</h1>
      <p>
        The browser reads authored fixtures. Filing an envelope changes only the practice register.
      </p>
      <dl>
        {components.map(([title, description, path]) => (
          <div key={title}>
            <dt>{title}</dt>
            <dd>
              {description}{' '}
              <a href={source + path}>
                Source<span className="sr-only"> for {title}</span>
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.limit}>
        A passing schema check establishes teaching-subset structure. Report delivery, clinical
        correctness and full FHIR conformance require separate evidence.
      </p>
      <Link href="/">Return to the referral desk</Link>
    </article>
  );
}
