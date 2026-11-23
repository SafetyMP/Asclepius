'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, ClipboardList, FileText } from 'lucide-react';
import { currentRef, mail, queueOutcome, useStudy, type Decision } from './shift';
import { EducatorWorksheet } from './educator-worksheet';
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
      <figcaption>
        Willow follows the request until Cedar’s written reply is accounted for.
      </figcaption>
    </figure>
  );
}

const reports = [mail[1], mail[2]] as const;
const actionLabel: Record<Decision, string> = {
  received: 'Mark report received',
  track: 'Keep tracking',
};

function ReportLetter() {
  const { inbox, inspected, setInspected, setCitation } = useStudy();
  const [open, setOpen] = useState(inspected);
  return (
    <details
      className={styles.sourceDetails}
      open={open}
      onToggle={(event) => {
        const reading = event.currentTarget.open;
        setOpen(reading);
        if (reading) {
          setInspected(true);
          setCitation(inbox.reference);
        }
      }}
    >
      <summary>{inbox.consultant ? 'Read Cedar’s report' : 'Read Cedar’s handoff note'}</summary>
      <p>{inbox.note}</p>
      <dl>
        <dt>Request cited in this document</dt>
        <dd>
          <code>{inbox.reference}</code>
        </dd>
      </dl>
    </details>
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
    setCitation,
    graded,
    setGraded,
    otherReview,
    setOtherReview,
    setRecord,
  } = useStudy();
  const result = decision && graded ? queueOutcome(inbox, decision) : null;
  function selectReport(next: (typeof mail)[number]) {
    if (next === inbox) return;
    if (graded && decision) setOtherReview({ document: inbox, decision });
    setInbox(next);
    setInspected(false);
    setCitation('');
    setDecision(null);
    setGraded(false);
  }

  return (
    <article className={`workspace-page ${styles.casePage}`}>
      <section className={styles.sheet} aria-labelledby="decision-title">
        <header className={styles.sheetHeader}>
          <div>
            <p className={styles.documentLabel}>Willow Teaching Clinic · Fictional case</p>
            <h1 id="decision-title">Maya is waiting to hear from Willow</h1>
            <p>
              At her November 13 visit, Maya Chen met with Sam Rivera at Willow. Sam asked Cedar’s
              specialist team to review Maya and write back. That request is a{' '}
              <strong>referral</strong>. Maya is waiting for Willow to tell her what happens next.
            </p>
          </div>
          <ReferralPath />
        </header>
        <section className={styles.shiftBrief} aria-labelledby="why-open">
          <h2 id="why-open">Why is Maya still on the list?</h2>
          <p>
            Cedar has recorded the handoff and put a visit on its calendar. Sam still needs the
            specialist’s written reply, the <strong>consultant report</strong>. Willow’s coordinator
            keeps a <strong>work queue</strong>, a list of requests the next shift needs to follow
            up.
          </p>
          <p>
            Maya has an earlier referral to Cedar, too. If Willow files a letter against the wrong
            request, the next shift could stop checking before Sam hears back. If staff overlook a
            reply already here, both clinics spend time chasing it while Maya waits for an update.
          </p>
        </section>
      </section>

      <section className={styles.sheet} aria-labelledby="desk-title">
        <p className={styles.documentLabel}>Willow’s referral desk</p>
        <h2 id="desk-title">A letter arrives from Cedar</h2>
        <p>
          Read Willow’s request alongside one incoming document. Each version begins with the same
          open queue entry for Maya.
        </p>
        <fieldset className={styles.inboxPicker}>
          <legend>Choose a report to inspect</legend>
          <div>
            {reports.map((item) => (
              <label className={styles.receipt} key={item.id}>
                <input
                  type="radio"
                  name="inbox"
                  checked={inbox === item}
                  onChange={() => selectReport(item)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.matchPair}>
          <section className={styles.document} aria-label="Open referral">
            <p className={styles.documentLabel}>Willow · Outgoing request</p>
            <h3>Sam’s request to Cedar</h3>
            <p>Maya Chen · November 13 · Sam Rivera</p>
            <p>Please review Maya and return your written report to Willow for this request.</p>
            <dl>
              <dt>Open request identifier</dt>
              <dd>
                <code>{currentRef}</code>
              </dd>
            </dl>
          </section>
          <section className={styles.document} aria-label="Selected inbox document">
            <p className={styles.documentLabel}>
              Cedar · {inbox.label} · {inbox.id}
            </p>
            <h3>{inbox.document}</h3>
            <p>
              Maya Chen · {inbox.sender} · {inbox.time}
            </p>
            <ReportLetter key={inbox.id} />
          </section>
        </div>
        <details className={styles.guidance}>
          <summary>Where should I look?</summary>
          <p>
            Read the line naming the request in each document. Do both identify the same piece of
            work? Then ask what the writer actually documented.
          </p>
        </details>
        <fieldset className={styles.queueEntry} disabled={!inspected}>
          <legend>Does Willow have enough evidence to mark this report received?</legend>
          {!inspected && <p>Open Cedar’s document first.</p>}
          <div className={styles.queueButtons}>
            {(['received', 'track'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={decision === value}
                onClick={() => {
                  setDecision(value);
                  setGraded(true);
                }}
              >
                {actionLabel[value]}
              </button>
            ))}
          </div>
        </fieldset>
        <div aria-live="polite">
          {result && (
            <section className={styles.assessment} aria-labelledby="queue-result">
              <h3 id="queue-result">What Willow’s queue would show</h3>
              <dl>
                <dt>Queue entry</dt>
                <dd>
                  <strong>{result.queue}</strong> ·{' '}
                  {result.supported ? 'Supported by this document' : 'Needs correction'}
                </dd>
                <dt>Evidence</dt>
                <dd>
                  {inbox.id} cites <code>{inbox.reference}</code>. {result.rationale}
                </dd>
                <dt>Next owner</dt>
                <dd>{result.next}</dd>
              </dl>
              <p className={styles.boundary}>
                This entry tracks correspondence. Sam still owns clinical review and communication
                with Maya.
              </p>
              {otherReview && otherReview.document !== inbox && decision ? (
                <div className={styles.comparison}>
                  <h4>Both letters against the same request</h4>
                  {[otherReview, { document: inbox, decision }].map((item) => (
                    <p key={item.document.id}>
                      <strong>{item.document.label}</strong> ·{' '}
                      <code>{item.document.reference}</code> · You chose “
                      {actionLabel[item.decision]}”.
                    </p>
                  ))}
                </div>
              ) : (
                <p>Try the other report above. Only Cedar’s letter changes.</p>
              )}
            </section>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="framework">
        <h2 id="framework">How Asclepius follows this handoff</h2>
        <p>
          FHIR (Fast Healthcare Interoperability Resources) gives teams a way to identify and link
          records. Here the request, Cedar’s coordination task and the planned visit each have their
          own identity. Asclepius checks the kind of document Willow received and the exact request
          it names. A clinician still needs to interpret the letter and decide what Maya needs next.
        </p>
        <Link className="text-link" href="/workspace">
          Trace this report and decision
        </Link>
        <details className={styles.guidance}>
          <summary>Inspect the three source records</summary>
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
                  <Link
                    className="text-link"
                    href="/workspace#record"
                    onClick={() => setRecord(key)}
                  >
                    Inspect {record.type}
                  </Link>
                </div>
              );
            })}
          </div>
        </details>
      </section>
      <EducatorWorksheet />
      <details className={styles.sources}>
        <summary className={styles.disclosure}>What shaped the exercise</summary>
        <p>
          CMS describes receipt of a consultant’s written response for the particular referral.
          IHI’s referral guide describes how teams share responsibility for follow-up. HL7 defines
          the request, task and references used in the teaching records. This exercise uses
          fictional correspondence and does not calculate a quality measure.
        </p>
        <a href="https://qpp.cms.gov/docs/QPP_quality_measure_specifications/CQM-Measures/2026_Measure_374_MIPSCQM.pdf">
          CMS · Receipt of specialist report (page 2)
        </a>
        <a href="https://www.ihi.org/library/publications/closing-loop-guide-safer-ambulatory-referrals-ehr-era">
          IHI · Referral follow-up
        </a>
        <a href="https://hl7.org/fhir/R4/servicerequest.html">HL7 R4 · ServiceRequest</a>
        <a href="https://hl7.org/fhir/R4/task.html">HL7 R4 · Task</a>
        <a href="https://hl7.org/fhir/R4/references.html">HL7 R4 · Resource references</a>
      </details>
    </article>
  );
}
