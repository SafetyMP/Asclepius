import type { ValidationIssue, ValidationRule } from '../types';

/**
 * MedicationRequest must have medicationCodeableConcept or medicationReference
 * (FHIR R4 requires medication[x] 1..1). Our zod schema makes both optional
 * (ADR 0002 pragmatic subset) — this profile rule enforces the cardinality.
 */
export const medicationRequestRule: ValidationRule = {
  id: 'medication-request-medication',
  description: 'MedicationRequest must have medicationCodeableConcept or medicationReference',
  appliesTo: ['MedicationRequest'],
  validate(resource): readonly ValidationIssue[] {
    if (resource.resourceType !== 'MedicationRequest') return [];
    if (
      resource.medicationCodeableConcept === undefined &&
      resource.medicationReference === undefined
    ) {
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
    return [];
  },
};
