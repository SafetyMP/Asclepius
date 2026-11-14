import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Braces, CheckCheck, Database, Plug } from 'lucide-react';

const source = 'https://github.com/SafetyMP/Asclepius/blob/main/';
const layers = [
  {
    number: '01',
    title: 'Start with a resource',
    icon: Braces,
    description:
      'A Zod schema describes the supported shape. TypeScript types are inferred from that same schema, so the runtime check and the developer-facing type share a source of truth.',
    path: 'src/domain/fhir/union.ts',
    label: 'Read the resource parser',
  },
  {
    number: '02',
    title: 'Turn problems into useful feedback',
    icon: CheckCheck,
    description:
      'The validation service checks structure first, then evaluates the kit’s profile rules. It returns an OperationOutcome with issues the interface can explain.',
    path: 'src/service/validation/service.ts',
    label: 'Follow the validation service',
  },
  {
    number: '03',
    title: 'Describe what the application needs',
    icon: Plug,
    description:
      'Ports define contracts such as saving, reading, and searching a resource. Application logic uses these contracts without choosing a database implementation.',
    path: 'src/port/repository.ts',
    label: 'Explore the repository port',
  },
  {
    number: '04',
    title: 'Keep infrastructure at the edge',
    icon: Database,
    description:
      'The local harness provides in-memory and SQLite repository adapters. Its composition root chooses and connects implementations. The browser lab needs neither storage adapter.',
    path: 'src/app.ts',
    label: 'Inspect the composition root',
  },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="eyebrow">UNDER THE SURFACE</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Small pieces. Clear boundaries.
        </h1>
        <p className="text-muted leading-relaxed">
          See how the synthetic case becomes structured information. These building blocks explain
          how records are checked and connected, with source code available when you want to look
          deeper.
        </p>
      </header>

      <section aria-label="Architecture walkthrough" className="grid gap-4 lg:grid-cols-2">
        {layers.map(({ number, title, icon: Icon, description, path, label }) => (
          <article key={number} className="panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-xs text-muted">LAYER {number}</span>
              <Icon className="h-5 w-5 text-teal-700" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
            <a
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
              href={`${source}${path}`}
            >
              {label}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </article>
        ))}
      </section>

      <section className="panel p-6 sm:p-8" aria-labelledby="dependency-heading">
        <div className="grid gap-7 lg:grid-cols-2">
          <div>
            <p className="eyebrow">THE DESIGN RULE</p>
            <h2 id="dependency-heading" className="mt-2 text-2xl font-semibold tracking-tight">
              Dependencies point inward.
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Adapters depend on ports and domain types. Services depend on ports and the domain.
              Domain code does not know about HTTP routes, databases, or this interface.
            </p>
            <a
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
              href={`${source}docs/adr/0003-ports-and-adapters.md`}
            >
              Read the architectural decision
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <ol
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-teal-50 p-5 text-center text-sm text-teal-950"
            aria-label="Dependency direction"
          >
            <li>HTTP · storage · auth adapters</li>
            <li>
              <ArrowDown className="mx-auto h-4 w-4" aria-hidden />
              <span className="sr-only">depend on</span>
            </li>
            <li className="font-medium">Services + port contracts</li>
            <li>
              <ArrowDown className="mx-auto h-4 w-4" aria-hidden />
              <span className="sr-only">depend on</span>
            </li>
            <li className="rounded-lg bg-white px-5 py-3 font-semibold">Domain schemas + types</li>
          </ol>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Continue exploring">
        <div className="panel p-6">
          <h2 className="text-lg font-semibold">Put the pieces in context</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Explore the synthetic case and its linked records. The validation lab offers a closer
            look at how a resource’s structure is checked.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="button">
              Explore the synthetic case
            </Link>
            <Link href="/validate" className="button secondary">
              Open validation lab
            </Link>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="text-lg font-semibold">Explore the local harness</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Search, authentication, and rule examples remain available in the backend for local,
            synthetic-data experiments.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-teal-800">
            <Link
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              href="/patients"
            >
              Search
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              href="/auth"
            >
              Authentication
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              href="/cds"
            >
              Rule examples
            </Link>
          </div>
        </div>
      </section>
      <p className="text-xs leading-6 text-muted">
        NOT_FOR_CLINICAL_USE · Educational subset, not full FHIR conformance. Use synthetic examples
        only. This demo does not connect to clinical systems.
      </p>
    </div>
  );
}
