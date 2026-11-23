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
export type Decision = 'track' | 'received';

// The queue records the learner's action, including an unsupported filing.
// It never changes the underlying FHIR records.
export function queueOutcome(document: (typeof mail)[number], decision: Decision) {
  const hasReceipt = receiptSupported(document, currentRef);
  const received = decision === 'received';
  const supported = received === hasReceipt;
  const queue = received ? 'Report received' : 'Still tracking';
  const next = received
    ? hasReceipt
      ? 'Willow’s clinician, Sam Rivera, reviews Cedar’s letter and decides how to follow up with Maya.'
      : 'Willow’s coordinator needs to reopen this item and ask Cedar for the report tied to this request. Until then, the next shift could miss it.'
    : hasReceipt
      ? 'Willow’s coordinator would keep chasing a letter already on file. Record its receipt and pass it to Sam for review.'
      : 'Willow’s coordinator keeps this request on the next shift’s list and follows up with Cedar. Cedar is responsible for returning its report.';
  return { supported, queue, next, rationale: document.response };
}

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
  const [inbox, setInbox] = useState<(typeof mail)[number]>(mail[1]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [inspected, setInspected] = useState(false);
  const [citation, setCitation] = useState('');
  const [graded, setGraded] = useState(false);
  const [cohort, setCohort] = useState(24);
  const [minutes, setMinutes] = useState(15);
  const [setup, setSetup] = useState(6);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [record, setRecord] = useState(currentRef);
  const [otherReview, setOtherReview] = useState<{
    document: (typeof mail)[number];
    decision: Decision;
  } | null>(null);
  return {
    otherReview,
    setOtherReview,
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
