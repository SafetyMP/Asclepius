import { describe, expect, it } from 'vitest';
import type { AllergyIntolerance, MedicationRequest } from '@/domain/fhir';
import type { PatientContext } from '../types';
import { drugAllergyRule } from './drug-allergy';

function ctx(allergies: AllergyIntolerance[], meds: MedicationRequest[]): PatientContext {
  return {
    patientId: 'p1',
    conditions: [],
    medicationRequests: meds,
    allergies,
    observations: [],
  };
}

function allergy(code: string, status?: string): AllergyIntolerance {
  return {
    resourceType: 'AllergyIntolerance',
    patient: { reference: 'Patient/p1' },
    code: { coding: [{ code }] },
    ...(status ? { clinicalStatus: { coding: [{ code: status }] } } : {}),
  } as AllergyIntolerance;
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

describe('drug-allergy rule', () => {
  it('fires when an active med code matches an allergy code', () => {
    const cards = drugAllergyRule.evaluate(ctx([allergy('1191')], [med('1191')]));
    expect(cards).toHaveLength(1);
    expect(cards[0]?.indicator).toBe('warning');
  });

  it('does NOT fire when codes differ', () => {
    expect(drugAllergyRule.evaluate(ctx([allergy('1191')], [med('9999')]))).toHaveLength(0);
  });

  it('skips inactive allergies', () => {
    expect(
      drugAllergyRule.evaluate(ctx([allergy('1191', 'inactive')], [med('1191')])),
    ).toHaveLength(0);
  });

  it('skips cancelled/stopped meds', () => {
    expect(
      drugAllergyRule.evaluate(ctx([allergy('1191')], [med('1191', 'cancelled')])),
    ).toHaveLength(0);
  });

  it('treats absent clinicalStatus as active', () => {
    expect(drugAllergyRule.evaluate(ctx([allergy('1191')], [med('1191')]))).toHaveLength(1);
  });
});
