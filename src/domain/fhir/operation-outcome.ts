/**
 * FHIR OperationOutcome — the canonical resource FHIR uses to communicate
 * outcomes (especially errors/warnings) on every API response.
 *
 * Defined ahead of the full resource model because the error layer renders to
 * it. See HL7 FHIR R4: http://hl7.org/fhir/operationoutcome.html
 */

export type IssueSeverity = 'fatal' | 'error' | 'warning' | 'information';

/** FHIR issue-type codes — why an issue was raised. */
export type IssueType =
  | 'invalid'
  | 'structure'
  | 'required'
  | 'value'
  | 'invariant'
  | 'security'
  | 'login'
  | 'unknown'
  | 'expired'
  | 'forbidden'
  | 'suppressed'
  | 'processing'
  | 'not-supported'
  | 'duplicate'
  | 'multiple-matches'
  | 'not-found'
  | 'deleted'
  | 'too-long'
  | 'code-invalid'
  | 'extension'
  | 'too-costly'
  | 'business-rule'
  | 'conflict'
  | 'transient'
  | 'lock-error'
  | 'no-store'
  | 'exception'
  | 'timeout'
  | 'incomplete'
  | 'throttled'
  | 'informational';

export interface OperationOutcomeIssue {
  severity: IssueSeverity;
  code: IssueType;
  diagnostics?: string;
  expression?: string[];
}

export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: OperationOutcomeIssue[];
}
