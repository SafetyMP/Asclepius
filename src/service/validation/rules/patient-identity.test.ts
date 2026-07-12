import { describe, expect, it } from 'vitest';
import type { FhirResource } from '@/domain/fhir';
import { patientIdentityRule } from './patient-identity';

const f = (r: unknown) => r as FhirResource;

describe('patient-identity rule', () => {
  it('fires on a Patient with no identifier or name', () => {
    const issues = patientIdentityRule.validate(f({ resourceType: 'Patient' }));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
  });

  it('passes when the patient has an identifier', () => {
    expect(
      patientIdentityRule.validate(
        f({ resourceType: 'Patient', identifier: [{ value: 'mrn-1' }] }),
      ),
    ).toHaveLength(0);
  });

  it('passes when the patient has a name', () => {
    expect(
      patientIdentityRule.validate(f({ resourceType: 'Patient', name: [{ family: 'Doe' }] })),
    ).toHaveLength(0);
  });

  it('is a no-op for non-Patient resources', () => {
    expect(patientIdentityRule.validate(f({ resourceType: 'Observation' }))).toHaveLength(0);
  });
});
