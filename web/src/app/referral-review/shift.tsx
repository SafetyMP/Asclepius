'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { referralExamples } from '@/lib/referral-examples';
import { recordKey } from '@/lib/journeys';

const currentRequest = referralExamples.find((record) => record.type === 'ServiceRequest');
if (!currentRequest) throw new Error('The referral study requires its ServiceRequest fixture.');
export const currentRef = recordKey(currentRequest);
export const priorRef = 'ServiceRequest/earlier-request';
export const mail = [
  {
    label: 'Original inbox',
    id: 'C16',
    time: '10:16',
    sender: 'Cedar Teaching Team',
    document: 'Coordination handoff',
    reference: currentRef,
    note: 'Cedar recorded the handoff as complete. The visit is planned.',
    consultant: false,
    response:
      'The completed task records coordination. Willow still needs evidence of receipt tied to this referral.',
  },
  {
    label: 'Report A',
    id: 'C40',
    time: '15:40',
    sender: 'Cedar Teaching Team',
    document: 'Written consultant report',
    reference: currentRef,
    note: 'Willow received Taylor Brooks’s signed consultant letter stating that Maya did not attend the appointment for the cited request.',
    consultant: true,
    response:
      'Willow has a consultant report for this request. Receipt documents communication, even when the letter records nonattendance.',
  },
  {
    label: 'Report B',
    id: 'C24',
    time: '10:24',
    sender: 'Cedar Teaching Team',
    document: 'Written consultant report',
    reference: priorRef,
    note: 'Willow received Taylor Brooks’s signed summary of findings for the cited request. Clinical details omitted.',
    consultant: true,
    response:
      'Cedar and the person match, but this letter cites an earlier referral. Maya’s current request still needs its own evidence of receipt.',
  },
] as const;
export function receiptSupported(document: (typeof mail)[number], target: string) {
  return document.consultant && document.reference === target;
}
export function assessReview(
  document: (typeof mail)[number],
  citation: string,
  entry: Decision | null,
) {
  return {
    referenceMatches: citation.trim() === document.reference,
    actionMatches: entry === (receiptSupported(document, currentRef) ? 'received' : 'track'),
  };
}
export type Decision = 'track' | 'received';
export type Sponsor = 'mentor' | 'guide' | 'pilot';
export const sponsors = [
  [
    'mentor',
    'Keep the mentor walkthrough',
    'Reserve mentor time for the intake. Use fresh cases to check whether coordinated and received are still confused.',
  ],
  [
    'guide',
    'Trial a one-page status guide',
    'Give the guide and walkthrough groups the same unseen reports. Record whether a learner can name the right request without a mentor.',
  ],
  [
    'pilot',
    'Pilot the interactive exercise',
    'Run the exercise alongside the walkthrough. Test a fresh same-person report one week later and compare both scores and combined staff time.',
  ],
] as const;
function useStudyState() {
  const [inbox, setInbox] = useState<(typeof mail)[number]>(mail[0]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [inspected, setInspected] = useState(false);
  const [citation, setCitation] = useState('');
  const [graded, setGraded] = useState(false);
  const [cohort, setCohort] = useState(24);
  const [minutes, setMinutes] = useState(15);
  const [setup, setSetup] = useState(6);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [record, setRecord] = useState(currentRef);
  return {
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
    record,
    setRecord,
  };
}
const StudyContext = createContext<ReturnType<typeof useStudyState> | null>(null);
export function StudyProvider({ children }: { children: ReactNode }) {
  return <StudyContext.Provider value={useStudyState()}>{children}</StudyContext.Provider>;
}
export function useStudy() {
  const value = useContext(StudyContext);
  if (!value) throw new Error('The referral study requires a shared case.');
  return value;
}
