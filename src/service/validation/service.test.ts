import { describe, expect, it } from 'vitest';
import { validationRules } from './rules';
import { createValidationService } from './service';

const svc = createValidationService(validationRules);

describe('ValidationService', () => {
  it('returns no issues for a valid Patient with a name', () => {
    const outcome = svc.validate({
      resourceType: 'Patient',
      name: [{ family: 'Doe' }],
    });
    expect(outcome.issue).toHaveLength(0);
  });

  it('returns a profile issue for a Patient with no identity', () => {
    const outcome = svc.validate({ resourceType: 'Patient' });
    expect(outcome.issue.length).toBeGreaterThanOrEqual(1);
    expect(outcome.issue.some((i) => (i.diagnostics ?? '').includes('identifier or name'))).toBe(
      true,
    );
  });

  it('returns a structural issue for schema-invalid input', () => {
    const outcome = svc.validate({ resourceType: 'Patient', gender: 'bogus' });
    expect(outcome.issue.some((i) => i.code === 'invalid')).toBe(true);
  });

  it('validateResource returns only profile issues (no structural)', () => {
    const outcome = svc.validateResource({
      resourceType: 'Patient',
      name: [{ family: 'Doe' }],
    } as never);
    expect(outcome.issue).toHaveLength(0);
  });
});
