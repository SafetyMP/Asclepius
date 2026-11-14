'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
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
  const initial =
    examples.find((example) => example.type === params.get('resource')) ?? examples[0];
  const [example, setExample] = useState(initial);
  const [body, setBody] = useState(JSON.stringify(initial.resource, null, 2));
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState('');
  const [challenge, setChallenge] = useState(false);
  function replaceBody(text: string) {
    setBody(text);
    setResult(null);
    setCopied('');
  }
  function reset() {
    replaceBody(JSON.stringify(example.resource, null, 2));
    setChallenge(false);
  }
  function validate() {
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
    const patient = examples[0];
    setExample(patient);
    setChallenge(true);
    replaceBody(
      JSON.stringify({ resourceType: 'Patient', id: 'demo-challenge', gender: 'unknown' }, null, 2),
    );
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied('JSON copied');
    } catch {
      setCopied('Copy unavailable. Select the JSON and copy it manually.');
    }
  }
  const issues = result?.kind === 'outcome' ? result.outcome.issue : [];
  const passed = result?.kind === 'outcome' && issues.length === 0;
  return (
    <div className="workspace-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">LOOK UNDER THE SURFACE</p>
          <h1>Make the structure make sense.</h1>
          <p className="page-subtitle">
            Inspect a synthetic record, check its shape, and learn from the feedback.
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
        <section className="panel editor-panel">
          <div className="section-heading">
            <h2>Resource payload</h2>
            <span className="subtle-pill">Synthetic examples</span>
          </div>
          <div className="editor-toolbar">
            <label htmlFor="example">Resource type</label>
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
                <option key={item.type}>{item.type}</option>
              ))}
            </select>
            <button className="icon-button" onClick={copy} aria-label="Copy JSON">
              <Copy size={17} />
            </button>
          </div>
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
            <span role="status">{copied}</span>
          </div>
          <div className="lab-actions">
            <button className="button secondary" onClick={reset}>
              <RotateCcw size={16} />
              Reset example
            </button>
            <button className="button primary" onClick={validate}>
              <CheckCheck size={17} />
              Validate resource
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <div className="lab-right">
          <section className="panel results-panel" aria-live="polite" aria-atomic="true">
            <div className="section-heading">
              <h2>Validation result</h2>
              <span className="subtle-pill">Local checks</span>
            </div>
            {!result ? (
              <div className="result-empty">
                <CircleDashed size={36} />
                <h3>Ready when you are.</h3>
                <p>
                  Run validation to see which checks this resource passes and what needs attention.
                </p>
                <div className="check-list">
                  <span>
                    <Check size={14} />
                    JSON syntax
                  </span>
                  <span>
                    <Check size={14} />
                    Resource structure
                  </span>
                  <span>
                    <Check size={14} />
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
              Load a patient without a name or identifier. Validate it to see the teaching rule in
              action.
            </p>
            <button className="text-link" onClick={loadChallenge}>
              Try a missing-identity example
              <ArrowRight size={15} />
            </button>
            {challenge && (
              <div className="challenge-hint">
                <strong>Try a repair</strong>
                <p>
                  Add a name such as <code>{'"name": [{ "family": "Example" }]'}</code>, then
                  validate again. Reset loads the complete fictional patient.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
function Check({ size }: { size: number }) {
  return <CheckCheck size={size} />;
}
export default function ValidatePage() {
  return (
    <Suspense fallback={<p>Opening the validation lab…</p>}>
      <ValidationLab />
    </Suspense>
  );
}
