import type { ValidationIssue, ValidationRule } from '../types';

/**
 * MedicationRequest.medication[x] is exactly one of medicationCodeableConcept
 * or medicationReference (FHIR R4 medication[x] 1..1). The zod schema leaves
 * both optional (ADR 0002 pragmatic subset); this profile rule enforces the
 * choice. status is required on the schema.
 */
export const medicationRequestRule: ValidationRule = {
  id: 'medication-request-medication',
  description:
    'MedicationRequest.medication[x] must be exactly one of medicationCodeableConcept or medicationReference',
  appliesTo: ['MedicationRequest'],
  validate(resource): readonly ValidationIssue[] {
    if (resource.resourceType !== 'MedicationRequest') return [];
    const hasConcept = resource.medicationCodeableConcept !== undefined;
    const hasReference = resource.medicationReference !== undefined;
    if (!hasConcept && !hasReference) {
      return [
        {
          severity: 'error',
          code: 'required',
          diagnostics:
            'MedicationRequest must have medicationCodeableConcept or medicationReference',
          expression: ['MedicationRequest.medication[x]'],
        },
      ];
    }
    if (hasConcept && hasReference) {
      return [
        {
          severity: 'error',
          code: 'invalid',
          diagnostics:
            'MedicationRequest.medication[x] must be exactly one of medicationCodeableConcept or medicationReference',
          expression: ['MedicationRequest.medication[x]'],
        },
      ];
    }
    return [];
  },
};
