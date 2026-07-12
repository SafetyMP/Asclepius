import { describe, expect, it } from 'vitest';
import type { MedicationRequest } from '@/domain/fhir';
import { createDdiChecker } from './checker';

function med(code: string, status = 'active'): MedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    intent: 'order',
    subject: { reference: 'Patient/p1' },
    status,
    medicationCodeableConcept: { coding: [{ code }] },
  } as MedicationRequest;
}

const checker = createDdiChecker();

describe('DdiChecker', () => {
  it('detects warfarin + ibuprofen interaction', () => {
    const alerts = checker.check([med('11289'), med('36567')]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.interaction.severity).toBe('major');
  });

  it('detects warfarin + aspirin interaction', () => {
    expect(checker.check([med('11289'), med('2412')])).toHaveLength(1);
  });

  it('returns no alerts for a single medication', () => {
    expect(checker.check([med('11289')])).toHaveLength(0);
  });

  it('ignores cancelled/stopped medications', () => {
    expect(checker.check([med('11289'), med('36567', 'cancelled')])).toHaveLength(0);
  });

  it('treats absent status as active', () => {
    const m1 = { ...med('11289'), status: undefined } as MedicationRequest;
    const m2 = { ...med('36567'), status: undefined } as MedicationRequest;
    expect(checker.check([m1, m2])).toHaveLength(1);
  });

  it('handles an empty medication list', () => {
    expect(checker.check([])).toHaveLength(0);
  });

  it('handles a med with no medicationCodeableConcept', () => {
    const m = {
      resourceType: 'MedicationRequest',
      intent: 'order',
      subject: { reference: 'Patient/p1' },
    } as MedicationRequest;
    expect(checker.check([m, med('11289')])).toHaveLength(0);
  });

  it('detects multiple interactions (warfarin + ibuprofen + aspirin)', () => {
    const alerts = checker.check([med('11289'), med('36567'), med('2412')]);
    expect(alerts).toHaveLength(2);
  });
});
