import type { ValidationIssue, ValidationRule } from '../types';

/**
 * Observation.code must have at least one coding with a system. Without a code
 * system, the meaning of the observation is ambiguous (not interoperable).
 */
export const observationCodeRule: ValidationRule = {
  id: 'observation-code-system',
  description: 'Observation.code must have at least one coding with a system',
  appliesTo: ['Observation'],
  validate(resource): readonly ValidationIssue[] {
    if (resource.resourceType !== 'Observation') return [];
    const code = resource.code;
    const coding = code?.coding;
    if (coding === undefined || coding.length === 0) {
      return [
        {
          severity: 'error',
          code: 'invalid',
          diagnostics: 'Observation.code must have at least one coding',
          expression: ['Observation.code.coding'],
        },
      ];
    }
    const hasSystem = coding.some((c) => c.system !== undefined && c.system !== '');
    if (!hasSystem) {
      return [
        {
          severity: 'error',
          code: 'invalid',
          diagnostics: 'Observation.code must have at least one coding with a system',
          expression: ['Observation.code.coding.system'],
        },
      ];
    }
    return [];
  },
};
