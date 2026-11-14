'use client';
import { createContext, useContext, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

type JourneyState = {
  step: number;
  visited: number[];
  journeySelection: string | null;
  explorerSelection: string | null;
  explorerQuery: string;
};
const initialState: JourneyState = {
  step: 0,
  visited: [0],
  journeySelection: null,
  explorerSelection: null,
  explorerQuery: '',
};
const JourneyContext = createContext<{
  state: JourneyState;
  setState: Dispatch<SetStateAction<JourneyState>>;
} | null>(null);

// Keep exploration context across client-side navigation. Never store edited resource data.
export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  return <JourneyContext.Provider value={{ state, setState }}>{children}</JourneyContext.Provider>;
}
export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('JourneyProvider is required');
  return context;
}
