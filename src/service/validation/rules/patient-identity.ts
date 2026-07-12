import type { ValidationIssue, ValidationRule } from '../types';

/**
 * Patient must have at least one identifier or name. A patient without either
 * cannot be distinguished from other patients — a patient-safety hazard.
 */
export const patientIdentityRule: ValidationRule = {
  id: 'patient-identity',
  description: 'Patient must have at least one identifier or name',
  appliesTo: ['Patient'],
  validate(resource): readonly ValidationIssue[] {
    if (resource.resourceType !== 'Patient') return [];
    const hasIdentifier = Array.isArray(resource.identifier) && resource.identifier.length > 0;
    const hasName = Array.isArray(resource.name) && resource.name.length > 0;
    if (!hasIdentifier && !hasName) {
      return [
        {
          severity: 'error',
          code: 'invalid',
          diagnostics: 'Patient must have at least one identifier or name',
          expression: ['Patient.identifier', 'Patient.name'],
        },
      ];
    }
    return [];
  },
};
