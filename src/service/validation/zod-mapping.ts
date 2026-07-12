import type { ZodError } from 'zod';
import type { ValidationIssue } from './types';

/** Convert a ZodError (structural validation failure) into ValidationIssue[]. */
export function zodErrorToIssues(error: ZodError): readonly ValidationIssue[] {
  return error.issues.map((issue) => ({
    severity: 'error' as const,
    code: 'invalid',
    diagnostics: issue.message,
    expression: issue.path.map(String),
  }));
}

/** Convert a non-ZodError thrown by parseResource (unsupported type, not-an-object). */
export function errorToIssue(e: unknown): ValidationIssue {
  return {
    severity: 'error',
    code: 'structure',
    diagnostics: e instanceof Error ? e.message : 'invalid resource',
    expression: [],
  };
}
