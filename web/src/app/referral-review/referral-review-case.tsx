'use client';

import { useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ClipboardList,
  FileText,
  Folder,
  Inbox,
  Mail,
  Undo2,
} from 'lucide-react';
import { followUps, mail, requests, useShift, type Filing, type MailId } from './shift';
import styles from './case.module.css';

export default function ReferralReview() {
  const { afternoon, setAfternoon, files, setFiles, owners, setOwners } = useShift();
  const readerTitle = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState<MailId | null>(null);
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState<Filing['purpose'] | ''>('');
  const [handoff, setHandoff] = useState(false);
  const [notice, setNotice] = useState('');
  const arrivals = afternoon ? mail : mail.slice(0, 2);
  const opened = arrivals.find((item) => item.id === selected);
  const waiting = arrivals.filter((item) => !files[item.id]).length;
  const filings = (index: number) => arrivals.filter((item) => files[item.id]?.request === index);
  const receipts = (index: number) =>
    filings(index).filter((item) => files[item.id]?.purpose === 'report');
  const valid = (index: number) =>
    receipts(index).some((item) => item.consultant && item.ref === requests[index]?.ref);
  const unsupported = arrivals.filter((item) => {
    const entry = files[item.id];
    return (
      entry?.purpose === 'report' && (!item.consultant || item.ref !== requests[entry.request]?.ref)
    );
  });
  const filedToOtherRequest = arrivals.filter((item) => {
    const entry = files[item.id];
    return entry && item.ref !== requests[entry.request]?.ref;
  });
  const openWithoutOwner = requests.filter(
    (_, index) => !valid(index) && owners[index] === 'Unassigned',
  ).length;

  function openItem(id: MailId) {
    setSelected(id);
    if (window.matchMedia('(max-width: 580px)').matches) readerTitle.current?.focus();
    const entry = files[id];
    setDestination(entry ? String(entry.request) : '');
    setPurpose(entry?.purpose ?? '');
    setNotice('');
  }
  function fileItem() {
    if (!opened || destination === '' || !purpose) return;
    const request = Number(destination);
    if (!requests[request]) return;
    setFiles({ ...files, [opened.id]: { request, purpose } });
    setNotice(
      `${opened.id} filed under the ${requests[request].date} request as ${purpose === 'report' ? 'report received' : 'correspondence'}.`,
    );
    setHandoff(false);
  }

  return (
    <article className={styles.desk}>
      <header className={styles.title}>
        <div>
          <p className={styles.kicker}>Willow Teaching Practice · Referral coordination</p>
          <h1>The referral desk</h1>
          <p>
            Two referrals for Maya Chen are on Willow’s register. Sort Cedar’s mail, decide what
            counts as a returned report, and leave a usable handoff for the next shift.
          </p>
        </div>
        <div className={styles.stamp}>
          <span>Saturday · 14 November</span>
          <strong>{afternoon ? '15:40' : '10:25'}</strong>
          <span>Synthetic shift</span>
        </div>
      </header>
      <div className={styles.workbench}>
        <section className={styles.tray} aria-labelledby="mail-title">
          <div className={styles.sectionHead}>
            <Inbox aria-hidden />
            <h2 id="mail-title">Incoming mail</h2>
          </div>
          <p>
            {waiting} unfiled · {arrivals.length} delivered
          </p>
          <ul className={styles.envelopes}>
            {arrivals.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={selected === item.id}
                  onClick={() => openItem(item.id)}
                >
                  <span className={styles.postmark}>
                    {item.time} <span>{item.id}</span>
                  </span>
                  <strong>{item.title}</strong>
                  <span>{item.from}</span>
                  <small>{files[item.id] ? 'Filed · review entry' : 'Unfiled · open item'}</small>
                </button>
              </li>
            ))}
          </ul>
          {!afternoon ? (
            <button
              type="button"
              className={styles.next}
              onClick={() => {
                setAfternoon(true);
                setHandoff(false);
                setNotice('Afternoon delivery received. One new letter arrived at 15:40.');
              }}
            >
              Receive afternoon delivery <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <p className={styles.delivery}>All three deliveries have arrived.</p>
          )}
        </section>

        <section className={styles.reader} aria-labelledby="reader-title">
          <div className={styles.sectionHead}>
            <Mail aria-hidden />
            <h2 id="reader-title" tabIndex={-1} ref={readerTitle}>
              Reading desk
            </h2>
          </div>
          {opened ? (
            <>
              <div className={styles.paper}>
                <div className={styles.letterHead}>
                  <span>Cedar Teaching Team</span>
                  <strong>{opened.id}</strong>
                </div>
                <h3>{opened.kind}</h3>
                <dl>
                  <dt>To</dt>
                  <dd>Willow Teaching Practice</dd>
                  <dt>From</dt>
                  <dd>{opened.from}</dd>
                  <dt>Re</dt>
                  <dd>Maya Chen · SYNTHETIC-002</dd>
                  <dt>Request</dt>
                  <dd>
                    <code>{opened.ref}</code>
                  </dd>
                </dl>
                <p>{opened.text}</p>
              </div>
              <fieldset className={styles.filing}>
                <legend>File this item</legend>
                <label>
                  Request register
                  <select
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                  >
                    <option value="">Select request</option>
                    {requests.map((request, i) => (
                      <option value={i} key={request.ref}>
                        {request.date} · {request.ref}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Register entry
                  <select
                    value={purpose}
                    onChange={(event) =>
                      setPurpose(
                        event.target.value === 'report'
                          ? 'report'
                          : event.target.value === 'note'
                            ? 'note'
                            : '',
                      )
                    }
                  >
                    <option value="">Select entry</option>
                    <option value="note">File as correspondence</option>
                    <option value="report">Record report received</option>
                  </select>
                </label>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primary}
                    disabled={destination === '' || !purpose}
                    onClick={fileItem}
                  >
                    <Folder size={16} aria-hidden /> Save filing
                  </button>
                  {files[opened.id] && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...files };
                        delete next[opened.id];
                        setFiles(next);
                        setPurpose('');
                        setDestination('');
                        setNotice(`${opened.id} returned to unfiled mail.`);
                        setHandoff(false);
                      }}
                    >
                      <Undo2 size={16} aria-hidden /> Unfile
                    </button>
                  )}
                </div>
              </fieldset>
            </>
          ) : (
            <div className={styles.empty}>
              <FileText size={43} strokeWidth={1.1} aria-hidden />
              <h3>Open an envelope</h3>
              <p>Compare the cited request with the register before you enter a receipt.</p>
            </div>
          )}
        </section>

        <section className={styles.register} aria-labelledby="register-title">
          <div className={styles.sectionHead}>
            <ClipboardList aria-hidden />
            <h2 id="register-title">Willow register</h2>
          </div>
          <p>Maya Chen · referring team, Willow · receiving team, Cedar</p>
          {requests.map((request, i) => (
            <article
              className={styles.folder}
              key={request.ref}
              aria-label={`${request.date} register`}
            >
              <span className={styles.tab}>{request.date}</span>
              <h3>{request.station}</h3>
              <code>{request.ref}</code>
              <div className={styles.receipt}>
                <ArrowDownLeft size={16} aria-hidden />
                {receipts(i).length ? 'Receipt entered' : 'Awaiting report'}
              </div>
              <ul>
                {filings(i).map((item) => (
                  <li key={item.id}>
                    {item.id} ·{' '}
                    {files[item.id]?.purpose === 'report' ? 'Report receipt' : 'Correspondence'}
                  </li>
                ))}
              </ul>
              <label>
                Follow-up owner
                <select
                  value={owners[i]}
                  onChange={(event) => {
                    const owner = followUps.find((name) => name === event.target.value);
                    if (owner) {
                      setOwners(owners.map((old, index) => (index === i ? owner : old)));
                      setHandoff(false);
                    }
                  }}
                >
                  {followUps.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </section>
      </div>
      <p role="status" className={styles.notice}>
        {notice}
      </p>
      <section className={styles.handoff} aria-labelledby="handoff-title">
        <div>
          <p className={styles.kicker}>Shift change</p>
          <h2 id="handoff-title">Handoff sheet</h2>
          <p>
            Reconcile the entries you made with the incoming documents. You can reopen and refile
            any item.
          </p>
        </div>
        <button type="button" className={styles.primary} onClick={() => setHandoff(true)}>
          Check this handoff <ArrowRight size={16} aria-hidden />
        </button>
        {handoff && (
          <div className={styles.review} role="status">
            <ul className={styles.metrics}>
              <li>
                <strong>{requests.filter((_, i) => valid(i)).length} / 2</strong>Supported report
                receipts
              </li>
              <li>
                <strong>{unsupported.length}</strong>Unsupported receipt entries
              </li>
              <li>
                <strong>{openWithoutOwner}</strong>Open requests without an owner
              </li>
            </ul>
            <p>
              {waiting
                ? `${waiting} unfiled ${waiting === 1 ? 'item' : 'items'} will pass to the next desk.`
                : 'The incoming tray is clear.'}
            </p>
            {unsupported.map((item) => (
              <p key={item.id}>
                <b>{item.id}</b> ·{' '}
                {item.consultant
                  ? 'The consultant cited a different request from the one entered.'
                  : 'The handoff notice confirms coordination only. A consultant report is still needed for this receipt.'}
              </p>
            ))}
            {filedToOtherRequest
              .filter((item) => files[item.id]?.purpose === 'note')
              .map((item) => (
                <p key={item.id}>
                  <b>{item.id}</b> · This correspondence cites another request. Check its folder.
                </p>
              ))}
            {requests.map((request, i) => (
              <p key={request.ref}>
                <b>{request.date}</b> ·{' '}
                {valid(i)
                  ? 'The source letter supports receipt.'
                  : `No matching report recorded. Follow-up owner: ${owners[i]}.`}
              </p>
            ))}
          </div>
        )}
      </section>
      <details className={styles.notes}>
        <summary>Practice context and sources</summary>
        <p>
          A referral supervisor can use the handoff sheet to discuss premature closure, outstanding
          correspondence, and who will follow up. The counts describe only this practice shift.
        </p>
        <p>
          The current request comes from Maya’s synthetic FHIR journey. The earlier request,
          incoming mail and register entries are hypothetical. The original task stays completed and
          the receiving encounter stays planned. Receipt records communication only.
        </p>
        <p>
          <a href="https://qpp.cms.gov/docs/QPP_quality_measure_specifications/CQM-Measures/2026_Measure_374_MIPSCQM.pdf">
            CMS · Receipt of Specialist Report
          </a>{' '}
          explains what qualifies as returned correspondence.{' '}
          <a href="https://www.ihi.org/library/publications/closing-loop-guide-safer-ambulatory-referrals-ehr-era">
            IHI · Safer Ambulatory Referrals
          </a>{' '}
          describes tracking responsibility across the referral. The exercise does not calculate a
          CMS quality score.
        </p>
      </details>
    </article>
  );
}
