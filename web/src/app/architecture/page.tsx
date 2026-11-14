import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Braces, CheckCheck, Database, Plug } from 'lucide-react';

const source = 'https://github.com/SafetyMP/Asclepius/blob/main/';
const journey = [
  {
    title: 'Start with the person',
    resource: 'Patient',
    description:
      'Alex Morgan is fictional. The patient record gives the other records a shared person to refer to.',
    question: 'Whose information is this?',
  },
  {
    title: 'Find the visit',
    resource: 'Encounter',
    description:
      'The visit connects Alex with the care team, clinic, and time. It gives the other records their setting.',
    question: 'Which visit does it belong to?',
  },
  {
    title: 'Inspect the measurement',
    resource: 'Observation',
    description:
      'The measurement records a value, its units, and when it was taken. This demo does not interpret that value.',
    question: 'What was recorded, and when?',
  },
  {
    title: 'Trace the report to its source',
    resource: 'DiagnosticReport',
    description:
      'The example report points back to the measurement. Follow that connection to see the source record.',
    question: 'Where did this information come from?',
  },
];
const glossary = [
  {
    term: 'FHIR',
    definition:
      'Fast Healthcare Interoperability Resources: an HL7 standard for exchanging healthcare information. This demo uses a small teaching subset of version R4.',
  },
  {
    term: 'Resource',
    definition:
      'A structured record about one kind of information, such as a person, a visit, or a measurement. Each record has its own role.',
  },
  {
    term: 'Reference',
    definition:
      'A link from one record to another. For example, a measurement can refer to the person and visit it belongs to.',
  },
  {
    term: 'Status',
    definition:
      'A label describing the state of a particular record. In this scenario, a draft request is a proposal; it is not evidence that medicine was dispensed or taken.',
  },
];
const layers = [
  {
    title: 'Resource schemas',
    icon: Braces,
    description:
      'Zod describes the supported structure. TypeScript types are inferred from the same schemas.',
    path: 'src/domain/fhir/union.ts',
    label: 'Read the resource parser',
  },
  {
    title: 'Validation service',
    icon: CheckCheck,
    description:
      'Structural checks run before three teaching profile rules. The result is an OperationOutcome describing any issues.',
    path: 'src/service/validation/service.ts',
    label: 'Read the validation service',
  },
  {
    title: 'Ports',
    icon: Plug,
    description:
      'Contracts describe capabilities such as saving and searching without choosing a database implementation.',
    path: 'src/port/repository.ts',
    label: 'Read the repository port',
  },
  {
    title: 'Adapters',
    icon: Database,
    description:
      'The separate local API has in-memory and SQLite adapters. Its composition root connects them; this browser demo does not use them.',
    path: 'src/app.ts',
    label: 'Read the composition root',
  },
];

export default function ArchitecturePage() {
  return (
    <div className="orientation-page space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">A QUICK ORIENTATION</p>
        <h1>Understand the story behind a record.</h1>
        <p className="text-muted leading-relaxed">
          You do not need to read code to explore Asclepius. Choose a routine visit or a referral
          between two teams, open its records, and trace how the information connects. The aim is to
          understand the record’s role and context—not to make a care decision.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className="button primary">
            Explore the care journey <ArrowRight size={17} aria-hidden />
          </Link>
          <Link href="/resources" className="button secondary">
            Open resource explorer
          </Link>
        </div>
      </header>

      <section aria-labelledby="follow-story-heading" className="space-y-4">
        <div className="space-y-2">
          <h2 id="follow-story-heading" className="text-xl">
            Four questions to guide your exploration
          </h2>
          <p className="text-muted">
            Use the connected records to move from the person to the source of a report.
          </p>
        </div>
        <ol className="orientation-steps grid gap-4 sm:grid-cols-2">
          {journey.map((item, index) => (
            <li key={item.resource} className="panel p-6">
              <p className="eyebrow">
                0{index + 1} · {item.resource}
              </p>
              <h3 className="mt-3 text-lg">{item.title}</h3>
              <p className="mt-3 text-muted leading-7">{item.description}</p>
              <p className="mt-4 font-semibold text-teal-900">{item.question}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel p-6 sm:p-8" aria-labelledby="handoff-guide">
        <p className="eyebrow">SCENARIO 02 · REFERRAL AND HANDOFF</p>
        <h2 id="handoff-guide" className="mt-3 text-xl">
          Who owns the next step?
        </h2>
        <p className="mt-3 text-muted leading-7">
          Maya’s fictional journey connects Willow’s referring team to Cedar’s receiving team. A
          ServiceRequest records what was requested and who it is for. A Task records who owns the
          coordination work and its outcome.
        </p>
        <p className="mt-3 text-muted leading-7">
          The handoff task is completed, the referral remains active, and the receiving visit is
          still planned. Those statuses describe different records. Moving between stages explores
          this fixed snapshot; it does not send a referral or change its status.
        </p>
        <p className="mt-3 text-muted leading-7">
          In the care journey, choose “A referral and handoff” to trace the request, receiving team,
          and planned visit.
        </p>
      </section>

      <section aria-labelledby="terms-heading" className="space-y-4">
        <h2 id="terms-heading" className="text-xl">
          A few useful terms
        </h2>
        <dl className="glossary-grid grid gap-4 sm:grid-cols-2">
          {glossary.map(({ term, definition }) => (
            <div key={term} className="panel p-6">
              <dt className="text-lg font-semibold">{term}</dt>
              <dd className="mt-3 text-muted leading-7">{definition}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted leading-7">
          For the full standard, see HL7’s{' '}
          <a
            className="font-semibold text-teal-800 underline underline-offset-4"
            href="https://hl7.org/fhir/R4/overview.html"
          >
            FHIR R4 overview
          </a>{' '}
          and{' '}
          <a
            className="font-semibold text-teal-800 underline underline-offset-4"
            href="https://hl7.org/fhir/R4/references.html"
          >
            explanation of references
          </a>
          .
        </p>
      </section>

      <section className="panel p-6 sm:p-8" aria-labelledby="demo-scope-heading">
        <h2 id="demo-scope-heading" className="text-xl">
          What you can learn here
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-muted leading-7">
              Inspect two journeys with nine linked fictional records each, identify their roles,
              and follow their connections. Open the validation lab to see how a missing detail can
              be detected by the kit’s structural checks and teaching rules.
            </p>
            <Link href="/validate" className="button secondary">
              Try the validation lab
            </Link>
          </div>
          <div className="space-y-3 text-muted leading-7">
            <p>
              Both scenarios are fixed and synthetic. It does not exchange live information with a
              clinic, save a clinical record, interpret results, or recommend treatment.
            </p>
            <p>
              Passing the lab’s checks does not mean a record is clinically correct, fully FHIR
              conformant, or safe to use for care. The local drug-interaction knowledge base is
              intentionally incomplete.
            </p>
          </div>
        </div>
      </section>

      <details className="panel p-6 sm:p-8">
        <summary className="cursor-pointer text-lg font-semibold">
          For developers: architecture and source code
        </summary>
        <div className="mt-6 space-y-6">
          <p className="text-muted leading-7">
            The browser and local API share the same domain schemas and validation service.
            Dependencies point inward: adapters use ports and domain types; services use ports and
            the domain; domain code does not depend on infrastructure.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {layers.map(({ title, icon: Icon, description, path, label }) => (
              <article key={title} className="rounded-lg border border-border p-5">
                <Icon className="mb-3 h-5 w-5 text-teal-700" aria-hidden />
                <h3 className="text-lg">{title}</h3>
                <p className="mt-3 text-muted leading-7">{description}</p>
                <a
                  className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-800 underline underline-offset-4"
                  href={`${source}${path}`}
                >
                  {label}
                  <ArrowUpRight size={15} aria-hidden />
                </a>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <a
              className="font-semibold text-teal-800 underline underline-offset-4"
              href={`${source}docs/adr/0003-ports-and-adapters.md`}
            >
              Architecture decision
            </a>
            <Link
              className="font-semibold text-teal-800 underline underline-offset-4"
              href="/resources"
            >
              Resource explorer
            </Link>
            <Link className="font-semibold text-teal-800 underline underline-offset-4" href="/auth">
              Local authentication example
            </Link>
            <Link className="font-semibold text-teal-800 underline underline-offset-4" href="/cds">
              Local rule examples
            </Link>
          </div>
        </div>
      </details>
      <p className="text-muted leading-7">
        NOT_FOR_CLINICAL_USE · Educational subset. Use fictional examples only. This demo does not
        connect to clinical systems.
      </p>
    </div>
  );
}
