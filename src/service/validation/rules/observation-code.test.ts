import { describe, expect, it } from 'vitest';
import type { FhirResource } from '@/domain/fhir';
import { observationCodeRule } from './observation-code';

const f = (r: unknown) => r as FhirResource;

describe('observation-code rule', () => {
  it('fires when code.coding has no system', () => {
    const issues = observationCodeRule.validate(
      f({
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ code: '1234' }] },
      }),
    );
    expect(issues).toHaveLength(1);
  });

  it('passes when at least one coding has a system', () => {
    expect(
      observationCodeRule.validate(
        f({
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '1234' }] },
        }),
      ),
    ).toHaveLength(0);
  });

  it('is a no-op for non-Observation resources', () => {
    expect(
      observationCodeRule.validate(f({ resourceType: 'Patient', name: [{ family: 'Doe' }] })),
    ).toHaveLength(0);
  });
});
