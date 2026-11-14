'use client';
import { ArrowRight, Check } from 'lucide-react';
import { journeys } from '@/lib/journeys';
import { useHydrated } from '@/lib/use-hydrated';
import { useJourney } from './journey-context';

export function JourneyPicker() {
  const { journeyId, setJourneyId } = useJourney();
  const hydrated = useHydrated();
  return (
    <section className="journey-picker" aria-label="Choose a synthetic journey">
      <p className="eyebrow">CHOOSE A SYNTHETIC JOURNEY</p>
      <div className="journey-picker-options">
        {journeys.map((journey) => (
          <button
            key={journey.id}
            className="journey-choice"
            type="button"
            disabled={!hydrated}
            aria-label={journey.label}
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
            <span className="journey-choice-description">
              {journey.person} · {journey.summary}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
