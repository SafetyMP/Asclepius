'use client';

import Link from 'next/link';
import { sponsors, useStudy } from './shift';
import styles from './case.module.css';

export function EducatorWorksheet() {
  const { cohort, setCohort, minutes, setMinutes, setup, setSetup, sponsor, setSponsor } =
    useStudy();
  const savedHours = (cohort * minutes) / 60;
  const netHours = savedHours - setup;
  const chartMax = Math.max(savedHours, setup, 1);
  return (
    <details className={styles.section}>
      <summary className={styles.disclosure}>How should the next coordinators learn this?</summary>
      <p id="pilot-title">
        The education lead is choosing how to train new coordinators and interface analysts. The
        practice’s referral lead can score whether a coordinator keeps the right case open. The
        interface mentor can ask an analyst to show which request the report belongs to. Score the
        queue entry and the explanation separately.
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
        <strong>Evidence for the education lead.</strong> Compare the current mentor walkthrough, a
        one-page status guide and this exercise. Give each group the same fresh synthetic cases with
        matching and unrelated receipts. Record correct queue decisions and correct request
        references separately, along with learner and mentor minutes. Keep the quickest option that
        matches or improves both scores against the walkthrough. Repeat on a fresh case one week
        later before committing the next cohort.
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
          <Link href="/workspace">Trace the training choice with this report</Link>
        </div>
      )}
    </details>
  );
}
