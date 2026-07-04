import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  BadRequestError,
  ConflictError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from '@/errors';
import { errorResponse } from './errors';

/** Trigger a real ZodError so `instanceof ZodError` is exercised, not faked. */
function zodError(): z.ZodError {
  try {
    z.object({ a: z.string() }).parse({ a: 1 });
    throw new Error('expected zod to throw');
  } catch (e) {
    return e as z.ZodError;
  }
}

describe('errorResponse — FhirError subclasses', () => {
  const cases: Array<[string, number, () => Error]> = [
    ['NotFoundError → 404', 404, () => new NotFoundError('x')],
    ['BadRequestError → 400', 400, () => new BadRequestError('x')],
    ['UnauthorizedError → 401', 401, () => new UnauthorizedError()],
    ['ConflictError → 409', 409, () => new ConflictError('x')],
    ['UnprocessableEntityError → 422', 422, () => new UnprocessableEntityError('x')],
    ['MethodNotAllowedError → 405', 405, () => new MethodNotAllowedError('x')],
    ['UnsupportedMediaTypeError → 415', 415, () => new UnsupportedMediaTypeError('x')],
  ];
  for (const [label, status, make] of cases) {
    it(label, () => {
      const r = errorResponse(make());
      expect(r.status).toBe(status);
      expect(r.body.resourceType).toBe('OperationOutcome');
      expect(r.body.issue[0]?.severity).toBe('error');
    });
  }
});

describe('errorResponse — non-FhirError', () => {
  it('maps a ZodError to 422 with flattened issues', () => {
    const r = errorResponse(zodError());
    expect(r.status).toBe(422);
    expect(r.body.issue[0]?.code).toBe('invalid');
    expect(r.body.issue[0]?.expression).toEqual(['a']);
  });

  it('maps any other error to 500 via the domain fallback', () => {
    const r = errorResponse(new Error('boom'));
    expect(r.status).toBe(500);
    expect(r.body.issue[0]).toMatchObject({
      severity: 'fatal',
      code: 'exception',
    });
    // never leaks the internal message
    expect(r.body.issue[0]?.diagnostics).toBe('Internal error');
  });
});
