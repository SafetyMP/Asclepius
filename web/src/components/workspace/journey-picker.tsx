'use client';
import { ArrowRight, Check } from 'lucide-react';
import { journeys } from '@/lib/journeys';
import { useHydrated } from '@/lib/use-hydrated';
import { useJourney } from './journey-context';

export function JourneyPicker() {
  const { journeyId, setJourneyId, journeyStates } = useJourney();
  const hydrated = useHydrated();
  return (
    <section className="journey-picker" aria-label="Choose a synthetic journey">
      <p className="eyebrow">CHOOSE A SYNTHETIC JOURNEY</p>
      <p className="journey-picker-help">
        Switch journeys and keep your stage, search, and open record.
      </p>
      <div className="journey-picker-options">
        {journeys.map((journey) => (
          <button
            key={journey.id}
            className="journey-choice"
            type="button"
            disabled={!hydrated}
            aria-label={journey.label}
            aria-describedby={`journey-choice-${journey.id}`}
            aria-pressed={journey.id === journeyId}
            onClick={() => setJourneyId(journey.id)}
          >
            <span className="journey-choice-heading">
              <span>{journey.label}</span>
              {journey.id === journeyId ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <ArrowRight size={18} aria-hidden="true" />
              )}
            </span>
            <span id={`journey-choice-${journey.id}`} className="journey-choice-description">
              {journey.person}
              <span className="journey-choice-stage">
                Stage {journeyStates[journey.id].step + 1} of {journey.stages.length} ·{' '}
                {journey.stages[journeyStates[journey.id].step].title}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
