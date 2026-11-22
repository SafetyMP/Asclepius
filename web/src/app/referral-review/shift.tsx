'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { referralExamples } from '@/lib/referral-examples';
import { recordKey } from '@/lib/journeys';

const currentRequest = referralExamples.find((record) => record.type === 'ServiceRequest');
if (!currentRequest) throw new Error('The referral desk requires the teaching ServiceRequest.');

export const requests = [
  {
    date: '13 Nov',
    ref: recordKey(currentRequest),
    station: 'Current register',
  },
  {
    date: '06 Nov',
    ref: 'ServiceRequest/earlier-request',
    station: 'Prior register',
  },
] as const;

export const mail = [
  {
    id: 'C16',
    time: '10:16',
    from: 'Cedar coordination',
    title: 'Handoff notice',
    kind: 'Coordination note',
    ref: requests[0].ref,
    text: 'Cedar completed the coordination task. The receiving visit is on the calendar.',
    consultant: false,
  },
  {
    id: 'C24',
    time: '10:24',
    from: 'Taylor Brooks · Cedar',
    title: 'Consultation letter',
    kind: 'Consultant report',
    ref: requests[1].ref,
    text: 'Signed summary from the consultant in response to the cited request. Clinical contents omitted.',
    consultant: true,
  },
  {
    id: 'C40',
    time: '15:40',
    from: 'Taylor Brooks · Cedar',
    title: 'Consultation letter',
    kind: 'Consultant report',
    ref: requests[0].ref,
    text: 'The consultant returned a written report about attendance in response to the cited request. Clinical contents omitted.',
    consultant: true,
  },
] as const;
export type MailId = (typeof mail)[number]['id'];
export type Filing = { request: number; purpose: 'report' | 'note' };
export type Files = Partial<Record<MailId, Filing>>;
export type FollowUp = 'Unassigned' | 'Willow referral desk' | 'Cedar liaison';
export const followUps: FollowUp[] = ['Unassigned', 'Willow referral desk', 'Cedar liaison'];

function useShiftState() {
  const [afternoon, setAfternoon] = useState(false);
  const [files, setFiles] = useState<Files>({});
  const [owners, setOwners] = useState<FollowUp[]>(['Unassigned', 'Unassigned']);
  return { afternoon, setAfternoon, files, setFiles, owners, setOwners };
}
const ShiftContext = createContext<ReturnType<typeof useShiftState> | null>(null);
export function ShiftProvider({ children }: { children: ReactNode }) {
  return <ShiftContext.Provider value={useShiftState()}>{children}</ShiftContext.Provider>;
}
export function useShift() {
  const value = useContext(ShiftContext);
  if (!value) throw new Error('The referral desk needs a shift provider.');
  return value;
}
