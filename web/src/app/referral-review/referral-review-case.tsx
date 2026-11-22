'use client';

import Link from 'next/link';
import { CalendarDays, ClipboardList, FileText, Link2, UserRound } from 'lucide-react';
import { assessReview, mail as inboxScenarios, sponsors, useStudy } from './shift';
import { recordKey } from '@/lib/journeys';
import { referralExamples } from '@/lib/referral-examples';
import styles from './case.module.css';

const evidence = [
  ['ServiceRequest/referral-request', 'Willow requested a review', FileText],
  ['Task/referral-handoff', 'Cedar coordinated the handoff', ClipboardList],
  ['Encounter/referral-receiving-visit', 'A visit is on the calendar', CalendarDays],
] as const;

function ReferralPath() {
  return (
    <figure
      className={styles.handoff}
      aria-label="Willow sends the request to Cedar. Willow tracks the return report."
    >
      <svg
        viewBox="0 0 360 130"
        role="img"
        aria-label="A request travels from Willow to Cedar. Willow expects Cedar’s report in return."
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path fill="#e4efe7" d="M12 105V56l33-18 33 18v49z" />
          <path d="m9 58 36-22 36 22M22 65h12v12H22zm35 0h12v12H57zM39 105V85h13v20M6 106h79" />
          <path d="M39 52h12m-6-6v12" />
          <path fill="#e4efe7" d="M279 105V59h15V38h37v21h16v46z" />
          <path d="M273 106h79m-52-59h8v8h-8zm16 0h8v8h-8zm-29 22h11v10h-11zm36 0h12v10h-12zm-18 36V85h13v20" />
          <path d="M94 57h167m-9-6 10 6-10 6" />
          <path strokeDasharray="4 5" d="M263 88H96" />
          <path d="m105 82-10 6 10 6" />
        </g>
        <g fill="currentColor" fontSize="13" fontFamily="Arial, sans-serif" textAnchor="middle">
          <text x="179" y="49">
            Referral request
          </text>
          <text x="179" y="108">
            Expected report
          </text>
          <text x="45" y="126" fontWeight="700">
            Willow
          </text>
          <text x="314" y="126" fontWeight="700">
            Cedar
          </text>
        </g>
      </svg>
    </figure>
  );
}

export default function ReferralReview() {
  const {
    inbox,
    setInbox,
    decision,
    setDecision,
    inspected,
    setInspected,
    citation,
    setCitation,
    graded,
    setGraded,
    cohort,
    setCohort,
    minutes,
    setMinutes,
    setup,
    setSetup,
    sponsor,
    setSponsor,
    setRecord,
  } = useStudy();
  const savedHours = (cohort * minutes) / 60;
  const netHours = savedHours - setup;
  const chartMax = Math.max(savedHours, setup, 1);
  const { referenceMatches, actionMatches } = assessReview(inbox, citation, decision);
  const canCheck = inspected && citation.trim().length > 0 && decision !== null;

  return (
    <article className={`workspace-page ${styles.casePage}`}>
      <section className={styles.sheet} aria-labelledby="decision-title">
        <header className={styles.sheetHeader}>
          <div>
            <p className={styles.documentLabel}>Willow Teaching Clinic / Fictional case</p>
            <h1 id="decision-title">Can Willow mark Maya’s report as received?</h1>
            <p>
              Match the inbox document to the open referral. As the coordinator, choose a queue
              entry. As the interface analyst, cite the exact request the document names.
            </p>
          </div>
          <ReferralPath />
        </header>
        <fieldset className={styles.inboxPicker}>
          <legend>Choose an inbox document</legend>
          <div>
            {inboxScenarios.map((item) => (
              <label className={styles.receipt} key={item.label}>
                <input
                  type="radio"
                  name="inbox"
                  checked={inbox === item}
                  onChange={() => {
                    setInbox(item);
                    setInspected(false);
                    setCitation('');
                    setDecision(null);
                    setGraded(false);
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.matchPair}>
          <section className={styles.document} aria-label="Open referral">
            <p className={styles.documentLabel}>Open referral</p>
            <h2>Request to Cedar</h2>
            <p className={styles.patient}>
              <UserRound size={16} aria-hidden />
              Maya Chen · Willow Teaching Clinic
            </p>
            <dl>
              <dt>
                <Link2 size={15} aria-hidden />
                Request identifier
              </dt>
              <dd>
                <code>{evidence[0][0]}</code>
              </dd>
            </dl>
            <p>Willow requested a review from Cedar. The referral remains active.</p>
          </section>
          <section
            className={styles.document}
            aria-label="Selected inbox document"
            aria-live="polite"
          >
            <p className={styles.documentLabel}>Willow’s inbox / {inbox.label}</p>
            <h2>{inbox.document}</h2>
            <p className={styles.patient}>
              <UserRound size={16} aria-hidden />
              Maya Chen · {inbox.sender}
            </p>
            <details
              className={styles.sourceDetails}
              key={inbox.label}
              open={inspected}
              onToggle={(event) => {
                setInspected(event.currentTarget.open);
              }}
            >
              <summary>Inspect document details</summary>
              <dl>
                <dt>
                  <Link2 size={15} aria-hidden />
                  Referral reference
                </dt>
                <dd>
                  <code>{inbox.reference}</code>
                </dd>
              </dl>
              <p>{inbox.note}</p>
            </details>
          </section>
        </div>
        <form
          className={styles.queueEntry}
          onSubmit={(event) => {
            event.preventDefault();
            if (canCheck) setGraded(true);
          }}
        >
          <h2>Your review note</h2>
          <p id="citation-help">
            Open the inbox document, then copy its full referral reference into your note.
          </p>
          <label className={styles.citation}>
            Request cited by the inbox document
            <input
              type="text"
              maxLength={160}
              value={citation}
              disabled={!inspected}
              aria-describedby="citation-help"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => {
                setCitation(event.target.value);
                setGraded(false);
              }}
            />
          </label>
          <fieldset
            className={styles.choices}
            disabled={!inspected || citation.trim().length === 0}
          >
            <legend>Which queue entry does the evidence support?</legend>
            {(
              [
                ['track', 'Continue tracking the report'],
                ['received', 'Mark report received'],
              ] as const
            ).map(([value, text]) => (
              <label className={styles.actionChoice} key={value}>
                <input
                  type="radio"
                  name="queue"
                  checked={decision === value}
                  onChange={() => {
                    setDecision(value);
                    setGraded(false);
                  }}
                />
                {text}
              </label>
            ))}
          </fieldset>
          <button className="button primary" disabled={!canCheck} type="submit">
            Check my review note
          </button>
          <div aria-live="polite">
            {graded && (
              <div className={styles.assessment}>
                <h3>
                  {referenceMatches && actionMatches
                    ? 'Both parts of your note are supported.'
                    : 'Review your note.'}
                </h3>
                <dl>
                  <dt>Request reference</dt>
                  <dd>
                    {referenceMatches
                      ? 'Matches the inbox document.'
                      : 'Reopen the inbox document and copy its full referral reference. The open request and the cited request can differ.'}
                  </dd>
                  <dt>Queue decision</dt>
                  <dd>
                    <strong>{actionMatches ? 'Supported. ' : 'Recheck the action. '}</strong>
                    {inbox.response}
                  </dd>
                </dl>
              </div>
            )}
          </div>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="evidence-title">
        <h2 id="evidence-title">What each record establishes</h2>
        <div className={styles.recordGrid}>
          {evidence.map(([key, label, Icon]) => {
            const record = referralExamples.find((item) => recordKey(item) === key);
            if (!record) return null;
            return (
              <div className={styles.record} key={key}>
                <span className={styles.trailIcon}>
                  <Icon size={23} aria-hidden />
                </span>
                <span>
                  {record.type} · {String(record.resource.status)}
                </span>
                <h3>{label}</h3>
                <Link className="text-link" href="/workspace#record" onClick={() => setRecord(key)}>
                  Inspect {record.type}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="pilot-title">
        <h2 id="pilot-title">Is the exercise worth adding to onboarding?</h2>
        <p>
          The interoperability education lead must decide how to train the next intake. The
          practice’s referral lead can score whether a coordinator keeps the right case open. The
          interface mentor can ask an analyst to show which request the report belongs to. A correct
          guess alone earns no credit for tracing the record.
        </p>
        <div className={styles.worksheet}>
          <div>
            <h3>First-year staff time</h3>
            <p>
              Illustrative assumptions. Enter total staff minutes saved per learner versus your
              current training, counting both learner and mentor time.
            </p>
            {[
              { label: 'Learners per year', value: cohort, change: setCohort, max: 120 },
              { label: 'Minutes saved per learner', value: minutes, change: setMinutes, max: 60 },
              { label: 'Preparation and upkeep hours', value: setup, change: setSetup, max: 40 },
            ].map(({ label, value, change, max }) => (
              <label className={styles.slider} key={label}>
                <span>
                  {label}
                  <strong>{value}</strong>
                </span>
                <input
                  type="range"
                  min="0"
                  max={max}
                  value={value}
                  aria-label={label}
                  onChange={(event) => change(Number(event.target.value))}
                />
              </label>
            ))}
          </div>
          <div className={styles.result} aria-live="polite">
            <strong>
              {Math.abs(netHours).toLocaleString('en-US', { maximumFractionDigits: 2 })} staff hours
            </strong>
            <span>
              {netHours < 0
                ? 'of additional time in year one'
                : netHours > 0
                  ? 'released in year one'
                  : 'net change in year one'}
            </span>
            <p>
              {minutes > 0
                ? `Break-even at ${Math.ceil((setup * 60) / minutes)} learners.`
                : setup > 0
                  ? 'With zero minutes saved, learner volume cannot recover the setup time.'
                  : 'Both preparation time and time saved are zero.'}
            </p>
            <figure className={styles.timeChart}>
              <figcaption>First-year comparison</figcaption>
              {[
                { label: 'Learner and mentor time freed', hours: savedHours },
                { label: 'Preparation and upkeep', hours: setup },
              ].map(({ label, hours }) => (
                <div key={label}>
                  <span>
                    {label} <b>{hours.toLocaleString('en-US', { maximumFractionDigits: 2 })} h</b>
                  </span>
                  <div className={styles.barTrack} aria-hidden="true">
                    <i style={{ width: `${(100 * hours) / chartMax}%` }} />
                  </div>
                </div>
              ))}
            </figure>
            <small>Annual learners × minutes saved ÷ 60, less preparation and upkeep.</small>
          </div>
        </div>
        <p>
          <strong>Evidence for the education lead.</strong> Compare the current mentor walkthrough,
          a one-page status guide and this exercise. Give each group the same fresh synthetic cases
          with matching and unrelated receipts. Record correct queue decisions and correct request
          references separately, along with learner and mentor minutes. Keep the quickest option
          that matches or improves both scores against the walkthrough. Repeat on a fresh case one
          week later before committing the next cohort.
        </p>
        <fieldset className={styles.sponsor}>
          <legend>What should the education lead fund next?</legend>
          {sponsors.map(([id, label]) => (
            <label key={id}>
              <input
                type="radio"
                name="sponsor"
                checked={sponsor === id}
                onChange={() => setSponsor(id)}
              />{' '}
              {label}
            </label>
          ))}
        </fieldset>
        {sponsor && (
          <div className={styles.assessment} aria-live="polite">
            <h3>{sponsors.find(([id]) => id === sponsor)?.[1]}</h3>
            <p>{sponsors.find(([id]) => id === sponsor)?.[2]}</p>
            <p>
              {netHours < 0
                ? `At these assumptions the exercise needs ${(-netHours).toLocaleString('en-US', { maximumFractionDigits: 2 })} additional staff hours in year one.`
                : netHours > 0
                  ? `At these assumptions the exercise releases ${netHours.toLocaleString('en-US', { maximumFractionDigits: 2 })} staff hours in year one.`
                  : 'At these assumptions the exercise breaks even on staff time.'}{' '}
              The paired scores and delayed retest still need to be measured.
            </p>
            <Link href="/workspace">Trace this case and sponsor choice</Link>
          </div>
        )}
      </section>

      <section className={styles.sources} aria-labelledby="sources-title">
        <h2 id="sources-title">What shaped the exercise</h2>
        <p>
          HL7 distinguishes the service requested from the task that tracks work. CMS’s referral
          measure asks whether the referring clinician received the consultant’s report. This
          synthetic exercise practices that distinction and does not calculate the measure.
        </p>
        <p>
          IHI’s referral guide identifies unclear responsibility and information transfer as
          problems across care teams. HL7’s FHIR Fundamentals course identifies interface
          implementers and project leads as audiences. This exercise brings those two perspectives
          to one handoff.
        </p>
        <a href="https://www.ihi.org/library/publications/closing-loop-guide-safer-ambulatory-referrals-ehr-era">
          IHI · Referral workflow and responsibilities
        </a>
        <a href="https://info.hl7.org/hubfs/Education/Brochures/FHIRFundamentals_2024.pdf">
          HL7 · FHIR Fundamentals audiences
        </a>
        <a href="https://hl7.org/fhir/R4/servicerequest.html">HL7 R4 · ServiceRequest</a>
        <a href="https://hl7.org/fhir/R4/task.html">HL7 R4 · Task</a>
        <a href="https://ecqi.healthit.gov/ecqm/ec/2026/cms0050v14">
          CMS50v14 · Receipt of specialist report
        </a>
      </section>
    </article>
  );
}
