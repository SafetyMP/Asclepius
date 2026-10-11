import { describe, expect, it } from 'vitest';
import type { FhirResource } from '@/domain/fhir';
import { medicationRequestRule } from './medication-request';

const f = (r: unknown) => r as FhirResource;

describe('medication-request rule', () => {
  it('fires when neither medication field is present', () => {
    const issues = medicationRequestRule.validate(
      f({
        resourceType: 'MedicationRequest',
        intent: 'order',
        subject: { reference: 'Patient/p1' },
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('required');
  });

  it('passes when medicationCodeableConcept is present', () => {
    expect(
      medicationRequestRule.validate(
        f({
          resourceType: 'MedicationRequest',
          intent: 'order',
          subject: { reference: 'Patient/p1' },
          medicationCodeableConcept: { coding: [{ code: 'x' }] },
        }),
      ),
    ).toHaveLength(0);
  });

  it('passes when only medicationReference is present', () => {
    expect(
      medicationRequestRule.validate(
        f({
          resourceType: 'MedicationRequest',
          intent: 'order',
          subject: { reference: 'Patient/p1' },
          medicationReference: { reference: 'Medication/m1' },
        }),
      ),
    ).toHaveLength(0);
  });

  it('fires when both medication fields are present', () => {
    const issues = medicationRequestRule.validate(
      f({
        resourceType: 'MedicationRequest',
        intent: 'order',
        subject: { reference: 'Patient/p1' },
        medicationCodeableConcept: { coding: [{ code: 'x' }] },
        medicationReference: { reference: 'Medication/m1' },
      }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('invalid');
    expect(issues[0]?.expression).toEqual(['MedicationRequest.medication[x]']);
  });

  it('is a no-op for non-MedicationRequest resources', () => {
    expect(
      medicationRequestRule.validate(f({ resourceType: 'Patient', name: [{ family: 'Doe' }] })),
    ).toHaveLength(0);
  });
});
