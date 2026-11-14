'use client';
import Link from 'next/link';
import { useHydrated } from '@/lib/use-hydrated';
import { useState } from 'react';
import { useJourney } from './journey-context';
import { JourneyPicker } from './journey-picker';
import { getJourney } from '@/lib/journeys';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  GitBranch,
  Info,
  Layers3,
  MapPin,
  RotateCcw,
  Stethoscope,
  UserRound,
  UsersRound,
  Send,
  Handshake,
} from 'lucide-react';
import { ResourceExplorer } from './resource-explorer';

const stageIcons = {
  person: UserRound,
  assessment: Stethoscope,
  report: ClipboardList,
  referral: Send,
  team: UsersRound,
  handoff: Handshake,
};
export function ScenarioWorkspace() {
  const hydrated = useHydrated();
  const [resetId, setResetId] = useState(0);
  const { state, setState, journeyId } = useJourney();
  const journey = getJourney(journeyId);
  const stages = journey.stages;
  const { step, visited } = state;
  const stage = stages[step] ?? stages[0];
  const lastStep = stages.length - 1;
  const nextStage = stages[step + 1];
  function changeStep(index: number) {
    setState((old) => ({
      ...old,
      step: index,
      visited: Array.from(new Set([...old.visited, index])),
      journeySelection: null,
    }));
  }
  return (
    <div className="workspace-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">CONNECTED CARE, EXPLAINED</p>
          <h1>{journey.headline}</h1>
          <p className="page-subtitle">
            Explore how a care journey becomes connected health information.
          </p>
        </div>
        <Link className="button secondary" href="/architecture">
          <BookIcon />
          Quick orientation
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <JourneyPicker />
      <div className="scenario-intro">
        <section className="scenario-card">
          <div className="scenario-card-top">
            <span className="eyebrow">SCENARIO {journey.number}</span>
            <span className="soft-pill">Fictional care journey</span>
          </div>
          <div className="person-summary">
            <span className="avatar">{journey.initials}</span>
            <div>
              <h2>
                Meet {journey.person}
                <span className="person-dot">.</span>
              </h2>
              <p>{journey.summary}</p>
            </div>
          </div>
          <div className="scenario-meta">
            <span>
              <CalendarDays size={15} />
              {journey.date}
            </span>
            <span>
              <MapPin size={15} />
              {journey.setting}
            </span>
            <span>
              <UserRound size={15} />
              {journey.team}
            </span>
          </div>
          <div className="scenario-card-bottom">
            <span>
              <Layers3 size={16} />
              <strong>{journey.records.length}</strong> connected records
            </span>
            <span>
              <GitBranch size={16} />
              <strong>{stages.length}</strong> moments in care
            </span>
            <span className="small-caps">SYNTHETIC DATA ONLY</span>
          </div>
        </section>
        <aside className="orientation-card">
          <span className="mini-icon">
            <GitBranch size={20} />
          </span>
          <h2>Follow the connections.</h2>
          <p>Move through the journey, inspect a record, then see the FHIR structure behind it.</p>
          <div className="progress-label">
            <span>Your exploration</span>
            <strong>
              {visited.length} of {stages.length} stages
            </strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${(visited.length / stages.length) * 100}%` }} />
          </div>
          <p className="session-note">
            Each journey keeps your place as you explore. Refresh starts a new session.
          </p>
        </aside>
      </div>
      <p className="journey-help">
        Start with a stage below, then open a record to see its details and connections. No
        technical knowledge is needed.
      </p>
      <section className="journey-section" aria-labelledby="journey-title">
        <div className="section-heading">
          <div className="title-inline">
            <h2 id="journey-title">The care journey</h2>
            <span className="subtle-pill">Interactive walkthrough</span>
          </div>
          <button
            disabled={!hydrated}
            className="text-link"
            onClick={() => {
              setState((old) => ({ ...old, step: 0, visited: [0], journeySelection: null }));
              setResetId((id) => id + 1);
            }}
          >
            <RotateCcw size={14} />
            Start over
          </button>
        </div>
        <div className="journey-steps" role="tablist" aria-label="Care journey stages">
          {stages.map((item, index) => {
            const StageIcon = stageIcons[item.icon];
            return (
              <button
                disabled={!hydrated}
                key={item.title}
                id={`stage-${index}`}
                role="tab"
                aria-selected={step === index}
                aria-controls="stage-content"
                className={`journey-step ${step === index ? 'current' : ''}`}
                onClick={() => changeStep(index)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'ArrowRight' ||
                    event.key === 'ArrowLeft' ||
                    event.key === 'Home' ||
                    event.key === 'End'
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? lastStep
                          : (step + (event.key === 'ArrowRight' ? 1 : lastStep)) % stages.length;
                    changeStep(next);
                    document.getElementById(`stage-${next}`)?.focus();
                  }
                }}
                tabIndex={step === index ? 0 : -1}
              >
                <span className="step-number">
                  {visited.includes(index) && step !== index ? (
                    <Check size={18} />
                  ) : (
                    `0${index + 1}`
                  )}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
                <StageIcon className="stage-icon" size={21} />
              </button>
            );
          })}
        </div>
        <div
          id="stage-content"
          role="tabpanel"
          aria-labelledby={`stage-${step}`}
          className="stage-content"
          tabIndex={0}
        >
          <div>
            <p className="eyebrow">{`0${step + 1}`} / THE STORY</p>
            <h3>{stage.heading}</h3>
            <p>{stage.description}</p>
            {journey.id === 'referral' && (
              <div className="handoff-context">
                <dl>
                  <div>
                    <dt>Team responsible at this stage</dt>
                    <dd>{stage.owner}</dd>
                  </div>
                  <div>
                    <dt>Recorded coordination state</dt>
                    <dd>{stage.status}</dd>
                  </div>
                </dl>
                <p className="recorded-moments-note">
                  These are recorded moments in a fictional handoff. Browsing the stages does not
                  change record status or send a referral.
                </p>
              </div>
            )}
          </div>
          <div className="takeaway">
            <Info size={18} />
            <p>{stage.takeaway}</p>
            {nextStage ? (
              <button
                disabled={!hydrated}
                className="text-link"
                onClick={() => changeStep(step + 1)}
              >
                Next: {nextStage.title}
                <ArrowRight size={15} />
              </button>
            ) : (
              <Link
                className="text-link"
                href={`/validate?journey=${journey.id}&record=${encodeURIComponent(journey.finalRecordKey)}&from=journey&stage=${lastStep}`}
                onClick={() =>
                  setState((old) => ({ ...old, journeySelection: journey.finalRecordKey }))
                }
              >
                {journey.finalActionLabel}
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </section>
      <ResourceExplorer
        key={`${journey.id}-${step}-${resetId}`}
        records={journey.records}
        recordKeys={stage.recordKeys}
        journeyId={journey.id}
        person={journey.person}
        compact
        context="journey"
        stage={step}
        initialRecord={state.journeySelection ?? undefined}
        onSelectionChange={(record) => setState((old) => ({ ...old, journeySelection: record }))}
      />
      <div className="bottom-note">
        <Info size={15} />
        <p>
          This is a guided teaching scenario, not a live clinical record. Nothing here is a
          diagnosis, prescription, or safety assessment.
        </p>
      </div>
    </div>
  );
}
function BookIcon() {
  return <Layers3 size={16} />;
}
