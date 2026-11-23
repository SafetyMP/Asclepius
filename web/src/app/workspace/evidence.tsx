'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useState } from 'react';
import { recordKey } from '@/lib/journeys';
import { referralExamples } from '@/lib/referral-examples';
import { teachingValidator } from '@/lib/validation';
import styles from '../referral-review/case.module.css';
import {
  currentRef,
  mail,
  priorRef,
  queueOutcome,
  receiptSupported,
  sponsors,
  useStudy,
} from '../referral-review/shift';

const source =
  'https://github.com/SafetyMP/Asclepius/blob/4a84959ccfa95ea69078c346f8ed740699f3ef88/';
const steps = ['Source records', 'Receipt rule', 'Queue entry'] as const;
const recordCode = {
  ServiceRequest: 'web/src/lib/referral-examples.ts#L127-L153',
  Task: 'web/src/lib/referral-examples.ts#L154-L185',
  Encounter: 'web/src/lib/referral-examples.ts#L104-L125',
} as const;
const records = referralExamples.filter(
  (item) =>
    ['ServiceRequest', 'Task'].includes(item.type) ||
    recordKey(item) === 'Encounter/referral-receiving-visit',
);
const trials = [
  { name: 'C16 · Coordination notice', doc: mail[0], target: currentRef },
  { name: 'C24 · Filed to current', doc: mail[2], target: currentRef },
  { name: 'C24 · Refiled to prior', doc: mail[2], target: priorRef },
  { name: 'C40 · Signed return', doc: mail[1], target: currentRef },
] as const;

export default function Evidence() {
  const study = useStudy();
  const { inbox, citation, decision, graded, cohort, minutes, setup, sponsor, record, setRecord } =
    study;
  const [trial, setTrial] = useState<(typeof trials)[number] | null>(null);
  const [validation, setValidation] = useState<'intact' | 'missing' | null>(null);
  const [step, setStep] = useState<(typeof steps)[number]>('Source records');
  const [trialsOpen, setTrialsOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const restoreLink = useEffectEvent(() => {
    const route = window.location.pathname.split('/').filter(Boolean).at(-1);
    const legacy = new URLSearchParams(window.location.search);
    if (!window.location.hash.startsWith('#trace?')) {
      const fromBookmark = records.find(
        (item) => recordKey(item) === legacy.get('record') || item.type === legacy.get('resource'),
      );
      if (fromBookmark) setRecord(recordKey(fromBookmark));
      if (window.location.hash === '#record') setStep('Source records');
      if (route && ['validate', 'architecture', 'auth', 'cds', 'interactions'].includes(route))
        setSchemaOpen(true);
      return;
    }
    const params = new URLSearchParams(window.location.hash.slice(7));
    const document = mail.find((item) => item.id === params.get('document')) ?? mail[1];
    const entry = params.get('entry');
    const citationValue = (params.get('citation') ?? '').slice(0, 160);
    const inspected = params.get('opened') === '1';
    const integer = (key: string, fallback: number, max: number) => {
      const raw = params.get(key);
      if (raw === null || !/^\d+$/.test(raw)) return fallback;
      return Math.min(max, Number(raw));
    };
    const otherDocument = mail.find((item) => item.id === params.get('otherDocument'));
    const otherEntry = params.get('otherEntry');
    study.setOtherReview(
      otherDocument &&
        otherDocument !== document &&
        (otherEntry === 'received' || otherEntry === 'track')
        ? { document: otherDocument, decision: otherEntry }
        : null,
    );
    study.setInbox(document);
    study.setInspected(inspected);
    study.setCitation(citationValue);
    study.setDecision(entry === 'received' || entry === 'track' ? entry : null);
    study.setGraded(
      inspected && (entry === 'received' || entry === 'track') && params.get('checked') === '1',
    );
    study.setCohort(integer('learners', 24, 120));
    study.setMinutes(integer('minutes', 15, 60));
    study.setSetup(integer('setup', 6, 40));
    study.setSponsor(sponsors.find(([id]) => id === params.get('sponsor'))?.[0] ?? null);
    setRecord(
      records.find((item) => recordKey(item) === params.get('record'))
        ? (params.get('record') ?? currentRef)
        : currentRef,
    );
    setStep(steps.find((item) => item === params.get('step')) ?? steps[0]);
    const savedTrial = trials.find((item) => item.name === params.get('trial')) ?? null;
    setTrial(savedTrial);
    setTrialsOpen(
      params.get('replays') === '1' || (params.get('replays') === null && Boolean(savedTrial)),
    );
    const schema = params.get('schema');
    setValidation(schema === 'intact' || schema === 'missing' ? schema : null);
    setSchemaOpen(params.get('boundary') === '1');
  });
  useEffect(() => {
    // The exported HTML is shared; restore the browser fragment after hydration.
    const frame = window.requestAnimationFrame(() => restoreLink());
    const onFragmentChange = () => restoreLink();
    window.addEventListener('hashchange', onFragmentChange);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', onFragmentChange);
    };
  }, []);
  const permalink = new URLSearchParams({
    document: inbox.id,
    entry: decision ?? '',
    citation,
    opened: study.inspected ? '1' : '0',
    checked: graded ? '1' : '0',
    learners: String(cohort),
    minutes: String(minutes),
    setup: String(setup),
    sponsor: sponsor ?? '',
    record,
    ...(study.otherReview && {
      otherDocument: study.otherReview.document.id,
      otherEntry: study.otherReview.decision,
    }),
    trial: trial?.name ?? '',
    schema: validation ?? '',
    boundary: schemaOpen ? '1' : '0',
    step,
    replays: trialsOpen ? '1' : '0',
  });
  const result = decision && graded ? queueOutcome(inbox, decision) : null;
  const selectedRecord = records.find((item) => recordKey(item) === record) ?? records[0];
  if (!selectedRecord) throw new Error('The referral trace requires a source fixture.');
  const payload = { ...selectedRecord.resource };
  if (validation === 'missing') delete payload.status;
  const outcome = validation ? teachingValidator.validate(payload) : null;
  const supported = trial && receiptSupported(trial.doc, trial.target);
  const selectedKey = recordKey(selectedRecord);
  const recordSource = recordCode[selectedRecord.type as keyof typeof recordCode];
  const note =
    decision === 'received'
      ? 'Mark report received'
      : decision === 'track'
        ? 'Continue tracking'
        : 'No entry selected';
  const net = (cohort * minutes) / 60 - setup;
  return (
    <article className={`workspace-page ${styles.guide} ${styles.inspector}`}>
      <header>
        <p className={styles.documentLabel}>Technical guide · Willow and Cedar</p>
        <h1>Trace Maya’s review note</h1>
        <p>Follow the selected letter from the referral file to Willow’s simulated work queue.</p>
      </header>
      <section id="record" aria-label="Your selected case">
        <p>
          <strong>
            {inbox.label} · {inbox.id}
          </strong>{' '}
          · {note}
        </p>
        <fieldset aria-label="Technical steps" className={styles.trials}>
          {steps.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={step === item}
              aria-controls="selected-step"
              onClick={() => setStep(item)}
            >
              {item}
            </button>
          ))}
        </fieldset>
        <div id="selected-step" aria-live="polite">
          {step === 'Source records' && (
            <>
              <h2>Where the two records come from</h2>
              <p>
                FHIR R4 is a standard for representing health records. Willow’s request is an
                example FHIR record. Cedar’s {inbox.id} is a teaching inbox document with its own
                type and cited request.
              </p>
              <div className={styles.controlLine}>
                <label>
                  FHIR record
                  <select
                    value={selectedKey}
                    onChange={(event) => {
                      setRecord(event.target.value);
                      setValidation(null);
                    }}
                  >
                    {records.map((item) => (
                      <option value={recordKey(item)} key={recordKey(item)}>
                        {item.type}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  <strong>{String(selectedRecord.resource.status)}</strong> ·{' '}
                  <code>{selectedKey}</code>
                  <br />
                  {selectedRecord.description}
                </p>
              </div>
              <p className={styles.provenance}>
                <a href={source + recordSource}>Selected FHIR fixture</a>
                {' · '}
                <a href={`${source}web/src/app/referral-review/shift.tsx#L7-L48`}>
                  Teaching inbox documents
                </a>
              </p>
            </>
          )}
          {step === 'Receipt rule' && (
            <>
              <h2>Which request does this letter cite?</h2>
              <p>
                The receipt check asks two questions. Is this a consultant report? Does it cite the
                complete reference for the request Willow is tracking?
              </p>
              <dl className={styles.trace}>
                <div>
                  <dt>Willow is tracking</dt>
                  <dd>
                    <code>{currentRef}</code>
                  </dd>
                </div>
                <div>
                  <dt>{inbox.id} cites</dt>
                  <dd>
                    <code>{inbox.reference}</code>
                  </dd>
                </div>
                <div>
                  <dt>Document type</dt>
                  <dd>{inbox.document}</dd>
                </div>
              </dl>
              {result && <p className={styles.trialResult}>{result.rationale}</p>}
              <p className={styles.provenance}>
                <a href={`${source}web/src/app/referral-review/shift.tsx#L49-L51`}>
                  Document type and reference check
                </a>
              </p>
            </>
          )}
          {step === 'Queue entry' && (
            <>
              <h2>What Willow’s next shift sees</h2>
              {result ? (
                <>
                  <dl className={styles.trace}>
                    <div>
                      <dt>Your queue entry</dt>
                      <dd>{result.queue}</dd>
                    </div>
                    <div>
                      <dt>Evidence for entry</dt>
                      <dd>{result.supported ? 'Supported' : 'Unsupported'}</dd>
                    </div>
                  </dl>
                  <p>{result.rationale}</p>
                  <p className={styles.trialResult}>
                    <strong>Follow-up owner</strong>
                    <br />
                    {result.next}
                  </p>
                </>
              ) : (
                <p>
                  Willow is tracking the return report.{' '}
                  <Link href="/#desk-title">Choose a queue entry in Maya’s case</Link> to inspect
                  its effect.
                </p>
              )}
              <p>
                The browser models the coordinator’s entry. The source request stays active.
                Clinical review and contact with Maya remain the team’s responsibility.
              </p>
              <p className={styles.provenance}>
                <a href={`${source}web/src/app/referral-review/shift.tsx#L64-L79`}>
                  Queue decision and follow-up logic
                </a>
              </p>
            </>
          )}
        </div>
      </section>
      <details open={schemaOpen} onToggle={(event) => setSchemaOpen(event.currentTarget.open)}>
        <summary>Run the shared validator</summary>
        <p>
          Check a copy of <code>{selectedKey}</code> against its teaching schema. Try the same
          record with the required <code>status</code> field removed.
        </p>
        <fieldset className={styles.trials} aria-label="Schema trial">
          {(['intact', 'missing'] as const).map((key) => (
            <button
              type="button"
              key={key}
              aria-pressed={validation === key}
              onClick={() => setValidation(key)}
            >
              {key === 'intact' ? 'Validate authored fixture' : 'Validate without its status'}
            </button>
          ))}
        </fieldset>
        {outcome && (
          <p role="status" className={styles.trialResult}>
            <strong>
              {outcome.issue.some((item) => item.severity === 'error' || item.severity === 'fatal')
                ? 'Structure rejected'
                : 'Passes the teaching subset'}
            </strong>{' '}
            · {outcome.resourceType} ·{' '}
            {outcome.issue.map((item) => item.diagnostics).join(' ') || 'No issues reported.'}
          </p>
        )}
        <p>
          This is the same validation service used by the local API. It checks record structure and
          applicable profile rules. It cannot tell whether a letter was received, a clinician
          reviewed it, or Maya attended.
        </p>
        <p className={styles.provenance}>
          <a href={`${source}src/service/validation/service.ts#L9-L37`}>Shared validator</a>
          {' · '}
          <a href={`${source}web/src/lib/validation.ts#L1-L5`}>Browser entry point</a>
          {' · '}
          <a href={`${source}src/app.ts#L48-L53`}>Local API wiring</a>
        </p>
      </details>
      {(result || trial) && (
        <details open={trialsOpen} onToggle={(event) => setTrialsOpen(event.currentTarget.open)}>
          <summary>Replay filing trials</summary>
          <p>
            These separate runs leave your queue decision in place. Try filing the same letter to
            the current and earlier requests.
          </p>
          <fieldset className={styles.trials} aria-label="Filing trial">
            {trials.map((item) => (
              <button
                type="button"
                key={item.name}
                aria-pressed={trial === item}
                onClick={() => setTrial(item)}
              >
                {item.name}
              </button>
            ))}
          </fieldset>
          {trial && (
            <div className={styles.trialResult} aria-live="polite">
              <strong>{supported ? 'Receipt supported' : 'Receipt unsupported'}</strong>
              <p>{trial.doc.note}</p>
              <dl className={styles.trace}>
                <div>
                  <dt>Letter cites</dt>
                  <dd>
                    <code>{trial.doc.reference}</code>
                  </dd>
                </div>
                <div>
                  <dt>Entry filed to</dt>
                  <dd>
                    <code>{trial.target}</code>
                  </dd>
                </div>
                <div>
                  <dt>Current request</dt>
                  <dd>
                    {supported && trial.target === currentRef
                      ? 'Record report received'
                      : 'Continue tracking'}
                  </dd>
                </div>
              </dl>
              <p>
                {!trial.doc.consultant
                  ? 'A completed handoff is correspondence.'
                  : trial.doc.reference !== trial.target
                    ? 'The patient matches, but the letter cites another request.'
                    : trial.target === priorRef
                      ? 'The earlier referral has a supported receipt. The current one stays open.'
                      : 'The signed return identifies Willow’s current referral.'}
              </p>
              <p>
                Your {inbox.label.toLowerCase()} uses {inbox.id}.{' '}
                {inbox.id === trial.doc.id
                  ? 'This trial reuses your selected document.'
                  : 'This is a separate synthetic letter for comparison.'}
              </p>
            </div>
          )}
          <p className={styles.provenance}>
            <a href={`${source}web/src/app/referral-review/shift.tsx#L7-L51`}>
              Trial inputs and receipt rule
            </a>
          </p>
        </details>
      )}
      <details>
        <summary>Education lead’s worksheet</summary>
        <p>
          {sponsors.find(([id]) => id === sponsor)?.[1] ?? 'Training decision open'}
          {' · '}
          {cohort} learners × {minutes} minutes / 60 − {setup} hours ={' '}
          {net.toLocaleString('en-US', { maximumFractionDigits: 2 })} net hours.
        </p>
        <Link href="/#pilot-title">Return to the educator worksheet</Link>
      </details>
      <p className={styles.provenance}>
        The case runs on fictional records in your browser. The public demo sends no referral,
        updates no clinical system and records no real receipt.
      </p>
      <Link href={`/workspace/#trace?${permalink}`}>Permalink to this evidence</Link> ·{' '}
      <Link href="/#decision-title">Return to Maya’s review note</Link>
    </article>
  );
}
