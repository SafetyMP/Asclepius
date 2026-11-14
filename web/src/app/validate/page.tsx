'use client';
import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useJourney } from '@/components/workspace/journey-context';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Braces,
  CheckCircle2,
  CheckCheck,
  CircleDashed,
  Copy,
  FlaskConical,
  RotateCcw,
} from 'lucide-react';
import { examples } from '@/lib/examples';
import { teachingValidator } from '@/lib/validation';

type Result =
  | { kind: 'json-error'; message: string }
  | { kind: 'outcome'; outcome: ReturnType<typeof teachingValidator.validate> };
function ValidationLab() {
  const params = useSearchParams();
  const editorRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  function reveal(panel: HTMLElement | null) {
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({ block: 'nearest' });
  }
  const { setState } = useJourney();
  const fromJourney = params.get('from') === 'journey';
  const returnType =
    examples.find((item) => item.type === params.get('resource'))?.type ?? 'Patient';
  const stageParam = params.get('stage');
  const returnStage = stageParam === '1' ? 1 : stageParam === '2' ? 2 : 0;
  const initial =
    examples.find((example) => example.type === params.get('resource')) ?? examples[0];
  const [example, setExample] = useState(initial);
  const [body, setBody] = useState(JSON.stringify(initial.resource, null, 2));
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState('');
  const [challenge, setChallenge] = useState(false);
  const [repairNotice, setRepairNotice] = useState('');
  const [advanced, setAdvanced] = useState(false);
  function replaceBody(text: string) {
    setBody(text);
    setResult(null);
    setCopied('');
    setRepairNotice('');
  }
  function reset() {
    replaceBody(JSON.stringify(example.resource, null, 2));
    setChallenge(false);
  }
  function validate() {
    reveal(resultRef.current);
    if (body.length > 100_000) {
      setResult({
        kind: 'json-error',
        message:
          'This teaching lab accepts up to 100,000 characters. Shorten the example and try again.',
      });
      return;
    }
    try {
      const input: unknown = JSON.parse(body);
      setResult({ kind: 'outcome', outcome: teachingValidator.validate(input) });
    } catch {
      setResult({
        kind: 'json-error',
        message:
          'This is not valid JSON. Check for missing commas, unclosed brackets, or unquoted property names, then try again.',
      });
    }
  }
  function loadChallenge() {
    reveal(editorRef.current);
    const patient = examples[0];
    setExample(patient);
    setChallenge(true);
    replaceBody(
      JSON.stringify({ resourceType: 'Patient', id: 'demo-challenge', gender: 'unknown' }, null, 2),
    );
  }
  function repairIdentity() {
    reveal(editorRef.current);
    try {
      const draft: unknown = JSON.parse(body);
      if (
        !draft ||
        typeof draft !== 'object' ||
        Array.isArray(draft) ||
        !('resourceType' in draft) ||
        draft.resourceType !== 'Patient'
      ) {
        setRepairNotice(
          'Load the missing-identity example to try this repair. Your current edits have been kept.',
        );
        return;
      }
      if ('name' in draft && Array.isArray(draft.name) && draft.name.length > 0) {
        setRepairNotice('A name is already present. Your current edits have been kept.');
        return;
      }
      replaceBody(JSON.stringify({ ...draft, name: [{ family: 'Example' }] }, null, 2));
      setRepairNotice(
        'Added the fictional family name “Example”. Other fields were kept. Check the record again to see the result.',
      );
    } catch {
      setRepairNotice(
        'The JSON needs a syntax fix first. Your edits have been kept; reset or reload the example to continue.',
      );
      setAdvanced(true);
    }
  }
  function restoreContext() {
    setState((old) =>
      fromJourney
        ? {
            ...old,
            step: returnStage,
            visited: Array.from(new Set([...old.visited, returnStage])),
            journeySelection: returnType,
          }
        : { ...old, explorerSelection: returnType },
    );
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied('JSON copied');
    } catch {
      setCopied('Copy unavailable. Select the JSON and copy it manually.');
      setAdvanced(true);
    }
  }
  const issues = result?.kind === 'outcome' ? result.outcome.issue : [];
  const passed = result?.kind === 'outcome' && issues.length === 0;
  return (
    <div className="workspace-page">
      <Link
        className="text-link context-return"
        href={fromJourney ? '/' : '/resources'}
        onClick={restoreContext}
      >
        <ArrowLeft size={16} />
        {fromJourney ? 'Back to care journey' : 'Back to resource explorer'}
      </Link>
      <div className="page-title">
        <div>
          <p className="eyebrow">LOOK UNDER THE SURFACE</p>
          <h1>Make the structure make sense.</h1>
          <p className="page-subtitle">
            Check whether a fictional record has the expected structure. No coding is needed to try
            it.
          </p>
        </div>
        <span className="soft-pill">
          <FlaskConical size={15} />
          Browser-only lab
        </span>
      </div>
      <div className="lab-intro">
        <span className="mini-icon">
          <Braces size={21} />
        </span>
        <p>
          <strong>From a story to a structured record.</strong> FHIR gives information a shared
          shape. This lab checks the kit’s nine schemas and three teaching rules. It does not check
          full FHIR conformance, terminology, reference existence, or clinical correctness.
        </p>
      </div>
      <div className="lab-layout">
        <section
          className="panel editor-panel"
          ref={editorRef}
          tabIndex={-1}
          aria-label="Practice draft"
        >
          <div className="section-heading">
            <h2>Check a sample record</h2>
            <span className="subtle-pill">Synthetic examples</span>
          </div>
          <div className="editor-toolbar">
            <label htmlFor="example">Record type</label>
            <select
              id="example"
              value={example.type}
              onChange={(event) => {
                const next = examples.find((item) => item.type === event.target.value);
                if (next) {
                  setExample(next);
                  replaceBody(JSON.stringify(next.resource, null, 2));
                  setChallenge(false);
                }
              }}
            >
              {examples.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.type} · {item.title}
                </option>
              ))}
            </select>
            <button className="icon-button" onClick={copy} aria-label="Copy JSON">
              <Copy size={17} />
            </button>
          </div>
          <p className="copy-status" role="status">
            {copied}
          </p>
          <div className="sample-context">
            <span className="eyebrow">ALEX MORGAN · FICTIONAL VISIT</span>
            <h3>{challenge ? 'Missing identity exercise' : example.title}</h3>
            <p>
              {challenge
                ? 'This exercise starts without a name or identifier. Check the draft, add a fictional name, and compare the result.'
                : example.description}
            </p>
            <p className="draft-note">
              {body === JSON.stringify(example.resource, null, 2)
                ? 'Original synthetic example loaded.'
                : 'Working draft — changes stay in this lab until you leave. The fictional case is unchanged.'}
            </p>
            <p role="status">{repairNotice}</p>
          </div>
          <details
            className="advanced-editor"
            open={advanced}
            onToggle={(event) => setAdvanced(event.currentTarget.open)}
          >
            <summary>View or edit JSON (advanced)</summary>
            <label className="sr-only" htmlFor="resource-json">
              FHIR resource JSON
            </label>
            <textarea
              id="resource-json"
              className="json-editor"
              spellCheck={false}
              maxLength={100_000}
              value={body}
              onChange={(event) => replaceBody(event.target.value)}
              aria-describedby="json-help"
            />
            <div className="editor-bottom">
              <span id="json-help">Fictional data only · 100,000-character limit</span>
            </div>
          </details>
          <div className="lab-actions">
            <button className="button secondary" onClick={reset}>
              <RotateCcw size={16} />
              Reset example
            </button>
            <button className="button primary" onClick={validate}>
              <CheckCheck size={17} />
              Check record structure
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <div className="lab-right">
          <section
            className="panel results-panel"
            ref={resultRef}
            tabIndex={-1}
            aria-label="Structure check result"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="section-heading">
              <h2>Structure check result</h2>
              <span className="subtle-pill">Local checks</span>
            </div>
            {!result ? (
              <div className="result-empty">
                <CircleDashed size={36} />
                <h3>Ready when you are.</h3>
                <p>Check the record to see what is present and which fields need attention.</p>
                <div className="check-list">
                  <span>
                    <CircleDashed size={14} />
                    JSON syntax
                  </span>
                  <span>
                    <CircleDashed size={14} />
                    Resource structure
                  </span>
                  <span>
                    <CircleDashed size={14} />
                    Teaching profile rules
                  </span>
                </div>
              </div>
            ) : passed ? (
              <div className="result-success">
                <CheckCircle2 size={32} />
                <h3>Passes this teaching subset</h3>
                <p>No issues were found by the kit’s structural and profile checks.</p>
                <p className="result-caveat">
                  This result is not clinical approval or full FHIR conformance.
                </p>
              </div>
            ) : (
              <div className="result-errors">
                <AlertCircle size={28} />
                <h3>
                  {result.kind === 'json-error'
                    ? 'Check your JSON syntax'
                    : `${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} to explore`}
                </h3>
                {result.kind === 'json-error' ? (
                  <p>{result.message}</p>
                ) : (
                  <ul>
                    {issues.map((issue, index) => (
                      <li key={index}>
                        <code>{issue.expression?.join(' · ') || 'resource'}</code>
                        <p>{issue.diagnostics ?? issue.code}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {result?.kind === 'outcome' && (
              <details className="raw-outcome">
                <summary>View OperationOutcome JSON</summary>
                <pre tabIndex={0}>{JSON.stringify(result.outcome, null, 2)}</pre>
              </details>
            )}
          </section>
          <section className="challenge-card">
            <span className="eyebrow">A SMALL EXPERIMENT</span>
            <h3>What happens when context is missing?</h3>
            <p>
              Load a patient without a name or identifier. Check its structure, then add a fictional
              name with one click.
            </p>
            <button className="text-link" onClick={loadChallenge}>
              Try a missing-identity example
              <ArrowRight size={15} />
            </button>
            {challenge && (
              <div className="challenge-hint">
                <strong>Try a repair without coding</strong>
                <p>
                  Add a fictional name, then check the structure again. This changes only the
                  practice draft.
                </p>
                <button className="button secondary" onClick={repairIdentity}>
                  Add a fictional name
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
function ValidationRoute() {
  const params = useSearchParams();
  return <ValidationLab key={params.toString()} />;
}

export default function ValidatePage() {
  return (
    <Suspense fallback={<p>Opening the validation lab…</p>}>
      <ValidationRoute />
    </Suspense>
  );
}
