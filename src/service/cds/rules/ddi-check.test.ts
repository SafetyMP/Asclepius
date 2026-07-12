import { describe, expect, it } from 'vitest';
import type { MedicationRequest } from '@/domain/fhir';
import type { PatientContext } from '../types';
import { ddiCheckRule } from './ddi-check';

function ctx(meds: MedicationRequest[]): PatientContext {
  return {
    patientId: 'p1',
    conditions: [],
    medicationRequests: meds,
    allergies: [],
    observations: [],
  };
}

function med(code: string): MedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    intent: 'order',
    subject: { reference: 'Patient/p1' },
    status: 'active',
    medicationCodeableConcept: { coding: [{ code, display: code }] },
  } as MedicationRequest;
}

describe('ddi-check CDS rule', () => {
  it('fires for warfarin + ibuprofen with a critical indicator', () => {
    const cards = ddiCheckRule.evaluate(ctx([med('11289'), med('36567')]));
    expect(cards).toHaveLength(1);
    expect(cards[0]?.indicator).toBe('critical');
    expect(cards[0]?.summary).toMatch(/MAJOR/i);
  });

  it('does NOT fire for a single medication', () => {
    expect(ddiCheckRule.evaluate(ctx([med('11289')]))).toHaveLength(0);
  });

  it('does NOT fire when no medications are present', () => {
    expect(ddiCheckRule.evaluate(ctx([]))).toHaveLength(0);
  });
});
