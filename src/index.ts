/**
 * Public API surface of the Asclepius library build.
 *
 * Exports the stable, dependency-free pieces (config, domain, errors, safety).
 * Adapters (http/storage/auth) and services are wired in app.ts and not
 * re-exported here — consumers should depend on ports, not concrete adapters.
 */

export { type AppConfig, loadConfig } from '@/config';
export type {
  IssueSeverity,
  IssueType,
  OperationOutcome,
  OperationOutcomeIssue,
} from '@/domain/fhir/operation-outcome';
export { NOT_FOR_CLINICAL_USE, SAFETY_BANNER } from '@/domain/safety';
export {
  BadRequestError,
  ConflictError,
  FhirError,
  type FhirErrorOptions,
  ForbiddenError,
  MethodNotAllowedError,
  NotFoundError,
  toOperationOutcome,
  UnauthorizedError,
  UnprocessableEntityError,
} from '@/errors';
