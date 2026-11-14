'use client';
import Link from 'next/link';
import { useHydrated } from '@/lib/use-hydrated';
import { useState } from 'react';
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
} from 'lucide-react';
import { ResourceExplorer } from './resource-explorer';

const stages = [
  {
    title: 'Check-in',
    subtitle: 'Who, where, and why',
    icon: UserRound,
    heading: 'Start with the person, not the paperwork.',
    description:
      'Alex arrives at Willow Teaching Clinic for a fictional follow-up. The patient, care team, and visit each have a record of their own. References connect them without repeating the same information.',
    types: ['Patient', 'Practitioner', 'Organization', 'Encounter'],
    takeaway: 'A visit is the connection point—not a container for everything.',
  },
  {
    title: 'Assessment',
    subtitle: 'Give observations context',
    icon: Stethoscope,
    heading: 'A measurement means more with context.',
    description:
      'A measurement, a recorded concern, and a reported allergy describe different things. Explore their records to see how each points back to Alex and the same visit. Values are illustrative and are not clinically interpreted.',
    types: ['Observation', 'Condition', 'AllergyIntolerance'],
    takeaway: 'Separate records keep measurements and reported concerns distinct.',
  },
  {
    title: 'Follow-up',
    subtitle: 'Connect the next chapter',
    icon: ClipboardList,
    heading: 'Follow the record back to its source.',
    description:
      'The example report links to the original measurement. A draft medication request illustrates an intended action—it does not mean a medicine was dispensed or taken. No treatment or safety assessment is made in this demo.',
    types: ['DiagnosticReport', 'MedicationRequest'],
    takeaway: 'A report links to evidence. A draft request remains a proposal.',
  },
];
export function ScenarioWorkspace() {
  const hydrated = useHydrated();
  const [resetId, setResetId] = useState(0);
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const stage = stages[step];
  function changeStep(index: number) {
    setStep(index);
    setVisited((old) => Array.from(new Set([...old, index])));
  }
  return (
    <div className="workspace-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">CONNECTED CARE, EXPLAINED</p>
          <h1>One visit. The whole picture.</h1>
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
      <div className="scenario-intro">
        <section className="scenario-card">
          <div className="scenario-card-top">
            <span className="eyebrow">SCENARIO 01</span>
            <span className="soft-pill">Fictional care journey</span>
          </div>
          <div className="person-summary">
            <span className="avatar">AM</span>
            <div>
              <h2>
                Meet Alex Morgan<span className="person-dot">.</span>
              </h2>
              <p>A routine follow-up. A connected story.</p>
            </div>
          </div>
          <div className="scenario-meta">
            <span>
              <CalendarDays size={15} />
              12 Nov 2026
            </span>
            <span>
              <MapPin size={15} />
              Willow Teaching Clinic
            </span>
            <span>
              <UserRound size={15} />
              Jordan Lee · Care team
            </span>
          </div>
          <div className="scenario-card-bottom">
            <span>
              <Layers3 size={16} />
              <strong>9</strong> connected records
            </span>
            <span>
              <GitBranch size={16} />
              <strong>3</strong> moments in care
            </span>
            <span className="small-caps">SYNTHETIC DATA ONLY</span>
          </div>
        </section>
        <aside className="orientation-card">
          <span className="mini-icon">
            <GitBranch size={20} />
          </span>
          <h2>Follow the connections.</h2>
          <p>Move through the visit, inspect a record, then see the FHIR structure behind it.</p>
          <div className="progress-label">
            <span>Your exploration</span>
            <strong>{visited.length} of 3 stages</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${(visited.length / 3) * 100}%` }} />
          </div>
          <p className="session-note">Progress is just for this visit to the demo.</p>
        </aside>
      </div>
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
              setStep(0);
              setVisited([0]);
              setResetId((id) => id + 1);
            }}
          >
            <RotateCcw size={14} />
            Start over
          </button>
        </div>
        <div className="journey-steps" role="tablist" aria-label="Care journey stages">
          {stages.map((item, index) => (
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
                        ? 2
                        : (step + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
                  changeStep(next);
                  document.getElementById(`stage-${next}`)?.focus();
                }
              }}
              tabIndex={step === index ? 0 : -1}
            >
              <span className="step-number">
                {visited.includes(index) && step !== index ? <Check size={18} /> : `0${index + 1}`}
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
              <item.icon className="stage-icon" size={21} />
            </button>
          ))}
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
          </div>
          <div className="takeaway">
            <Info size={18} />
            <p>{stage.takeaway}</p>
            {step < 2 ? (
              <button
                disabled={!hydrated}
                className="text-link"
                onClick={() => changeStep(step + 1)}
              >
                Next: {stages[step + 1].title}
                <ArrowRight size={15} />
              </button>
            ) : (
              <Link className="text-link" href="/validate">
                Try the validation lab
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </section>
      <ResourceExplorer key={`${step}-${resetId}`} types={stage.types} compact />
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
