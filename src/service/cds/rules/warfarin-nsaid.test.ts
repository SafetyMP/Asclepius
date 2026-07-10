import { describe, expect, it } from 'vitest';
import type { MedicationRequest } from '@/domain/fhir';
import type { PatientContext } from '../types';
import { warfarinNsaidRule } from './warfarin-nsaid';

function ctx(meds: MedicationRequest[]): PatientContext {
  return {
    patientId: 'p1',
    conditions: [],
    medicationRequests: meds,
    allergies: [],
    observations: [],
  };
}

function med(code: string, status = 'active'): MedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    intent: 'order',
    subject: { reference: 'Patient/p1' },
    status,
    medicationCodeableConcept: { coding: [{ code }] },
  } as MedicationRequest;
}

describe('warfarin-nsaid rule', () => {
  it('fires when patient is on warfarin + an NSAID', () => {
    const cards = warfarinNsaidRule.evaluate(ctx([med('11289'), med('36567')]));
    expect(cards).toHaveLength(1);
    expect(cards[0]?.summary).toMatch(/bleeding/i);
  });

  it('does NOT fire with only warfarin', () => {
    expect(warfarinNsaidRule.evaluate(ctx([med('11289')]))).toHaveLength(0);
  });

  it('does NOT fire with only an NSAID', () => {
    expect(warfarinNsaidRule.evaluate(ctx([med('36567')]))).toHaveLength(0);
  });

  it('ignores cancelled meds', () => {
    expect(warfarinNsaidRule.evaluate(ctx([med('11289'), med('36567', 'cancelled')]))).toHaveLength(
      0,
    );
  });
});
