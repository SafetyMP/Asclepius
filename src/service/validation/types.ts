import type { FhirResource } from '@/domain/fhir';
import type { IssueType } from '@/domain/fhir/operation-outcome';

/**
 * Validation types — internal to `@/service/validation`.
 * `severity` and `code` use FHIR OperationOutcome issue values.
 */

export interface ValidationIssue {
  readonly severity: 'fatal' | 'error' | 'warning' | 'information';
  readonly code: IssueType;
  readonly diagnostics: string;
  readonly expression: string[];
}

/**
 * A profile validation rule — a pure predicate over a parsed FhirResource.
 * Mirrors the CDS rule pattern (proven, testable, registry-extensible).
 */
export interface ValidationRule {
  readonly id: string;
  readonly description: string;
  readonly appliesTo: readonly string[];
  readonly validate: (resource: FhirResource) => readonly ValidationIssue[];
}
