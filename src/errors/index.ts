import type { IssueSeverity, IssueType, OperationOutcome } from '@/domain/fhir/operation-outcome';

/**
 * Typed domain error hierarchy.
 *
 * First principles: a FHIR server's error responses are OperationOutcome
 * resources with an HTTP status. Rather than throwing strings or generic
 * Errors and then guessing a status at the handler boundary, each domain
 * error carries its own (status, severity, issue code, diagnostics). The HTTP
 * adapter then just renders the outcome — no error-to-status guessing game,
 * and tests can assert on typed errors directly.
 */

export interface FhirErrorOptions {
  diagnostics: string;
  // explicit `| undefined` so callers may pass undefined under exactOptionalPropertyTypes
  expression?: string[] | undefined;
  cause?: unknown;
}

export class FhirError extends Error {
  readonly status: number;
  readonly severity: IssueSeverity;
  readonly code: IssueType;
  readonly expression: string[] | undefined;

  constructor(status: number, severity: IssueSeverity, code: IssueType, options: FhirErrorOptions) {
    super(options.diagnostics, { cause: options.cause });
    this.name = new.target.name;
    this.status = status;
    this.severity = severity;
    this.code = code;
    this.expression = options.expression;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toOperationOutcome(): OperationOutcome {
    const issue = {
      severity: this.severity,
      code: this.code,
      diagnostics: this.message,
    } satisfies OperationOutcome['issue'][number];
    if (this.expression) {
      return {
        resourceType: 'OperationOutcome',
        issue: [{ ...issue, expression: this.expression }],
      };
    }
    return { resourceType: 'OperationOutcome', issue: [issue] };
  }
}

export class NotFoundError extends FhirError {
  constructor(diagnostics: string) {
    super(404, 'error', 'not-found', { diagnostics });
  }
}

export class BadRequestError extends FhirError {
  constructor(diagnostics: string, expression?: string[]) {
    super(400, 'error', 'invalid', { diagnostics, expression });
  }
}

export class UnauthorizedError extends FhirError {
  constructor(diagnostics = 'Authentication required') {
    super(401, 'error', 'login', { diagnostics });
  }
}

export class ForbiddenError extends FhirError {
  constructor(diagnostics = 'Insufficient scope') {
    super(403, 'error', 'forbidden', { diagnostics });
  }
}

export class ConflictError extends FhirError {
  constructor(diagnostics: string) {
    super(409, 'error', 'conflict', { diagnostics });
  }
}

/** 422 — validation failures against a FHIR profile. */
export class UnprocessableEntityError extends FhirError {
  constructor(diagnostics: string, expression?: string[]) {
    super(422, 'error', 'invalid', { diagnostics, expression });
  }
}

export class MethodNotAllowedError extends FhirError {
  constructor(diagnostics: string) {
    super(405, 'error', 'not-supported', { diagnostics });
  }
}

/**
 * Render an arbitrary thrown value into an OperationOutcome. Used by the HTTP
 * error boundary as the last line of defense so the API never leaks a stack
 * trace or a non-FHIR body.
 */
export function toOperationOutcome(error: unknown): OperationOutcome {
  if (error instanceof FhirError) return error.toOperationOutcome();
  return {
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: 'fatal',
        code: 'exception',
        diagnostics: 'Internal error',
      },
    ],
  };
}
