'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useState } from 'react';
import {
  assessReview,
  receiptSupported,
  currentRef,
  priorRef,
  mail,
  sponsors,
  useStudy,
} from '../referral-review/shift';
import { recordKey } from '@/lib/journeys';
import { referralExamples } from '@/lib/referral-examples';
import { teachingValidator } from '@/lib/validation';
import styles from '../referral-review/case.module.css';

const source = 'https://github.com/SafetyMP/Asclepius/blob/16bfbd8/';
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
  const [schemaOpen, setSchemaOpen] = useState(false);
  const restoreLink = useEffectEvent(() => {
    const route = window.location.pathname.split('/').filter(Boolean).at(-1);
    const legacy = new URLSearchParams(window.location.search);
    if (!window.location.hash.startsWith('#trace?')) {
      const fromBookmark = records.find(
        (item) => recordKey(item) === legacy.get('record') || item.type === legacy.get('resource'),
      );
      if (fromBookmark) setRecord(recordKey(fromBookmark));
      if (route && ['validate', 'architecture', 'auth', 'cds', 'interactions'].includes(route))
        setSchemaOpen(true);
      return;
    }
    const params = new URLSearchParams(window.location.hash.slice(7));
    const document = mail.find((item) => item.id === params.get('document')) ?? mail[0];
    const entry = params.get('entry');
    const citationValue = (params.get('citation') ?? '').slice(0, 160);
    const inspected = params.get('opened') === '1';
    const integer = (key: string, fallback: number, max: number) => {
      const raw = params.get(key);
      if (raw === null || !/^\d+$/.test(raw)) return fallback;
      return Math.min(max, Number(raw));
    };
    study.setInbox(document);
    study.setInspected(inspected);
    study.setCitation(citationValue);
    study.setDecision(entry === 'received' || entry === 'track' ? entry : null);
    study.setGraded(
      inspected &&
        Boolean(citationValue.trim()) &&
        (entry === 'received' || entry === 'track') &&
        params.get('checked') === '1',
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
    setTrial(trials.find((item) => item.name === params.get('trial')) ?? null);
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
    trial: trial?.name ?? '',
    schema: validation ?? '',
    boundary: schemaOpen ? '1' : '0',
  });
  const review = assessReview(inbox, citation, decision);
  const selectedRecord = records.find((item) => recordKey(item) === record) ?? records[0];
  if (!selectedRecord) throw new Error('The referral trace requires a source fixture.');
  const payload = { ...selectedRecord.resource };
  if (validation === 'missing') delete payload.status;
  const outcome = validation ? teachingValidator.validate(payload) : null;
  const supported = trial && receiptSupported(trial.doc, trial.target);
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
        <p className={styles.documentLabel}>Implementation evidence · Synthetic referral</p>
        <h1>Trace Maya’s review note</h1>
        <p>
          Follow the selected inbox document from its source to Willow’s queue. Run a filing trial
          or test the fixture with the same validator as the local API.
        </p>
      </header>
      <section aria-labelledby="selected">
        <h2 id="selected">Your selected case</h2>
        <dl className={styles.trace}>
          <div>
            <dt>Inbox</dt>
            <dd>
              {inbox.label} · {inbox.id} · {inbox.document}
            </dd>
          </div>
          <div>
            <dt>Analyst citation</dt>
            <dd>
              <code>{citation || 'No reference entered'}</code>
            </dd>
          </div>
          <div>
            <dt>Coordinator entry</dt>
            <dd>
              {note} · {graded ? 'checked in the study' : 'unchecked'}
            </dd>
          </div>
          <div>
            <dt>Education lead</dt>
            <dd>
              {sponsors.find(([id]) => id === sponsor)?.[1] ?? 'Decision open'} · {cohort} learners
              × {minutes} minutes / 60 − {setup} hours ={' '}
              {net.toLocaleString('en-US', { maximumFractionDigits: 2 })} net hours
            </dd>
          </div>
        </dl>
        {graded && (
          <p>
            <strong>Checked note:</strong> citation{' '}
            {review.referenceMatches ? 'matches' : 'does not match'} the letter; the queue entry is{' '}
            {review.actionMatches ? 'supported' : 'unsupported'} for Willow’s current request.
          </p>
        )}
      </section>
      <section aria-labelledby="record">
        <h2 id="record">1. Resolve a source record</h2>
        <div className={styles.controlLine}>
          <label>
            FHIR record
            <select
              value={recordKey(selectedRecord)}
              onChange={(e) => {
                setRecord(e.target.value);
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
            <code>{recordKey(selectedRecord)}</code>
            <br />
            {selectedRecord.description}
          </p>
        </div>
        <a href={source + 'web/src/lib/referral-examples.ts'}>View the authored fixture</a>
      </section>
      <section aria-labelledby="filing">
        <h2 id="filing">2. Replay a receipt entry</h2>
        <p>
          Try filing a letter as a consultant report. The register compares document type and the
          full request reference. A second run can change only the filing destination.
        </p>
        <div className={styles.trials} role="group" aria-label="Filing trial">
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
        </div>
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
        <a href={source + 'web/src/app/referral-review/referral-review-case.tsx'}>
          Source of the filing and correction rules
        </a>{' '}
        · <a href={source + 'web/src/app/referral-review/shift.tsx'}>Trial documents</a>
      </section>
      <details open={schemaOpen} onToggle={(event) => setSchemaOpen(event.currentTarget.open)}>
        <summary>3. Test structure and inspect the boundary</summary>
        <p>
          Validate the selected record locally. Remove its status for a second run. Both trials
          operate on a copy.
        </p>
        <div className={styles.trials} role="group" aria-label="Schema trial">
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
        </div>
        {outcome && (
          <p role="status">
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
          Eleven R4 schemas and three profile rules check structure. They cannot establish delivery,
          clinical correctness or attendance. The static export calls no Hono API, database, EHR or
          pharmacy. The intentionally incomplete drug-interaction examples have no role in this
          case.
        </p>
        <a href={source + 'src/service/validation/service.ts'}>Shared validation service</a> ·{' '}
        <a href={source + 'src/app.ts'}>Local API composition root</a>
      </details>
      <p className={styles.provenance}>
        The original request, task and encounter are authored FHIR fixtures. C16, C24 and C40 are
        synthetic teaching overlays; the selected filing trials are browser replays. Opening a trace
        sends no referral.
      </p>
      <Link href={`/workspace/#trace?${permalink}`}>Permalink to this evidence</Link> ·{' '}
      <Link href="/#decision-title">Return to Maya’s review note</Link> ·{' '}
      <Link href="/#pilot-title">Return to the educator worksheet</Link>
    </article>
  );
}
