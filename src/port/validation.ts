import type { FhirResource } from '@/domain/fhir';
import type { OperationOutcome } from '@/domain/fhir/operation-outcome';

/**
 * Validation port — validates FHIR resources (structural zod + profile rules).
 * Returns an OperationOutcome with issues (never throws).
 *
 * `validate` runs the full pipeline (zod structural + profile rules) on raw JSON.
 * `validateResource` runs profile rules only on an already-parsed resource
 * (used by create/update handlers that have already done structural validation).
 */
export interface ValidationService {
  validate(input: unknown): OperationOutcome;
  validateResource(resource: FhirResource): OperationOutcome;
}
