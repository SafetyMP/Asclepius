'use client';
import { createContext, useContext, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { JourneyId } from '@/lib/journeys';

type JourneyState = {
  step: number;
  visited: number[];
  journeySelection: string | null;
  explorerSelection: string | null;
  explorerQuery: string;
};
const initialState = (): JourneyState => ({
  step: 0,
  visited: [0],
  journeySelection: null,
  explorerSelection: null,
  explorerQuery: '',
});
const JourneyContext = createContext<{
  journeyId: JourneyId;
  setJourneyId: Dispatch<SetStateAction<JourneyId>>;
  state: JourneyState;
  setState: Dispatch<SetStateAction<JourneyState>>;
  setJourneyState: (id: JourneyId, action: SetStateAction<JourneyState>) => void;
} | null>(null);

// Each fictional journey keeps independent navigation context. Never store edited resources.
export function JourneyProvider({ children }: { children: ReactNode }) {
  const [journeyId, setJourneyId] = useState<JourneyId>('routine');
  const [states, setStates] = useState<Record<JourneyId, JourneyState>>({
    routine: initialState(),
    referral: initialState(),
  });
  function setJourneyState(id: JourneyId, action: SetStateAction<JourneyState>) {
    setStates((old) => ({ ...old, [id]: typeof action === 'function' ? action(old[id]) : action }));
  }
  function setState(action: SetStateAction<JourneyState>) {
    setJourneyState(journeyId, action);
  }
  return (
    <JourneyContext.Provider
      value={{ journeyId, setJourneyId, state: states[journeyId], setState, setJourneyState }}
    >
      {children}
    </JourneyContext.Provider>
  );
}
export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('JourneyProvider is required');
  return context;
}
