import Link from 'next/link';
import { ArrowUpRight, Terminal } from 'lucide-react';

export default function LocalReferencePage() {
  return (
    <div className="max-w-4xl space-y-7">
      <header className="space-y-3">
        <p className="eyebrow">RULE COMPOSITION</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Understand how rules compose.
        </h1>
        <p className="max-w-3xl text-muted leading-relaxed">
          The former clinical decision support screen is now a guide to the local rule examples.
          Explore the implementation with synthetic fixtures instead of entering patient
          information.
        </p>
      </header>
      <section className="panel p-6 sm:p-8">
        <h2 className="text-xl font-semibold">From context to a teaching example</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          The service evaluates rules against a patient context and returns example cards. Read the
          rule service and its tests to see how the pieces fit together. These examples are not
          validated clinical guidance.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <a
            href="https://github.com/SafetyMP/Asclepius/blob/main/src/service/cds/service.ts"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
          >
            Read the rule service
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
          <a
            href="https://github.com/SafetyMP/Asclepius/blob/main/src/service/cds/service.test.ts"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
          >
            Explore the service tests
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>
      <section className="panel p-6 sm:p-8" aria-labelledby="local-setup">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-teal-700" aria-hidden />
          <h2 id="local-setup" className="text-xl font-semibold">
            Try the local teaching harness
          </h2>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted">
          The local harness includes allergy and bleeding-risk rule examples, plus an intentionally
          incomplete drug-interaction knowledge base. Run tests using synthetic data only.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm leading-7 text-slate-100">
          <code>{`git clone https://github.com/SafetyMP/Asclepius.git
cd Asclepius
npm ci
npm test
npm run dev`}</code>
        </pre>
        <p className="mt-4 text-sm leading-6 text-muted">
          Requires Node.js 22 or newer and npm 10. See the{' '}
          <a
            className="font-semibold text-teal-800 underline underline-offset-4"
            href="https://github.com/SafetyMP/Asclepius#getting-started"
          >
            repository setup guide
          </a>{' '}
          for the supported environment and local API details.
        </p>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="button">
          Return to the synthetic case
        </Link>
        <Link href="/architecture" className="button secondary">
          Explore the architecture
        </Link>
      </div>
      <aside
        role="note"
        className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"
      >
        <p className="font-semibold">NOT_FOR_CLINICAL_USE</p>
        <p className="mt-1">
          Educational reference only. Do not store, process, or base clinical decisions on real
          patient data. The drug-interaction knowledge base is intentionally incomplete.
        </p>
      </aside>
    </div>
  );
}
