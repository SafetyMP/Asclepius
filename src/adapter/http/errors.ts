import { ZodError } from 'zod';
import type { OperationOutcome } from '@/domain/fhir/operation-outcome';
import { FhirError, toOperationOutcome } from '@/errors';

/**
 * Error boundary mapping. Every `FhirError` carries its own (status, severity,
 * issue-code), so there is no status-guessing here — the boundary just renders.
 * `ZodError` (from `parseResource`) → 422 with flattened issues; anything else
 * → 500 via the domain's `toOperationOutcome` so the API never leaks a stack.
 */

export interface ErrorResponse {
  readonly status: number;
  readonly body: OperationOutcome;
}

export function errorResponse(err: unknown): ErrorResponse {
  if (err instanceof FhirError) {
    return { status: err.status, body: err.toOperationOutcome() };
  }
  if (err instanceof ZodError) {
    return { status: 422, body: zodToOutcome(err) };
  }
  return { status: 500, body: toOperationOutcome(err) };
}

function zodToOutcome(err: ZodError): OperationOutcome {
  return {
    resourceType: 'OperationOutcome',
    issue: err.issues.map((i) => ({
      severity: 'error',
      code: 'invalid',
      diagnostics: i.message,
      expression: i.path.map(String),
    })),
  };
}
