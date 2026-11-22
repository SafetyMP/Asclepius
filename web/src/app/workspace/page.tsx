import Link from 'next/link';
import { pageMetadata } from '@/lib/site-metadata';
import styles from '../referral-review/case.module.css';

export const metadata = pageMetadata(
  'workspace/',
  'Technical workspace · Asclepius',
  'Find care journeys, linked FHIR resources, validation tools and the limits of the synthetic evidence.',
);

export default function Workspace() {
  return (
    <article className={`workspace-page ${styles.guide}`}>
      <header>
        <p className={styles.documentLabel}>FHIR R4 teaching kit</p>
        <h1>Technical workspace</h1>
        <p>Trace a reference, check a resource, or see what the fictional cases can establish.</p>
      </header>
      <details open>
        <summary>Teaching tools</summary>
        <ul>
          <li>
            <Link href="/journeys">Care journeys</Link> · Follow Alex’s visit or Maya’s referral.
          </li>
          <li>
            <Link href="/resources">Resource explorer</Link> · Inspect the full record and its
            links.
          </li>
          <li>
            <Link href="/validate">Validation lab</Link> · Check and repair a synthetic resource.
          </li>
        </ul>
      </details>
      <details>
        <summary>Fixtures and evidence</summary>
        <p>
          Each journey has nine authored records. The original referral snapshot contains an active
          request, a completed coordination task, and a planned receiving visit. Report A and Report
          B are hypothetical inbox documents in the case exercise.
        </p>
        <a href="https://github.com/SafetyMP/Asclepius/blob/main/web/src/lib/referral-examples.ts">
          Inspect Maya’s fixture records
        </a>
      </details>
      <details>
        <summary>Validation limits and architecture</summary>
        <p>
          The lab checks eleven resource schemas and three teaching rules. A passing check cannot
          establish that a visit happened or a report reached the right person.
        </p>
        <Link href="/architecture">How the teaching kit works</Link>
      </details>
      <Link className="text-link" href="/">
        Return to the referral exercise
      </Link>
    </article>
  );
}
