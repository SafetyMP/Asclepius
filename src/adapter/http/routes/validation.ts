import type { Env, Hono } from 'hono';
import type { HttpDeps } from '../app';
import { fhirResponse } from '../json';
import { requireFhirContentType, requireResourceType } from '../validation';

/**
 * FHIR `$validate` operation — `POST /{Type}/$validate` (ADR: validation pillar).
 *
 * Validates a resource body (structural zod + profile rules) WITHOUT storing it.
 * Always returns 200 + OperationOutcome (the outcome IS the result — FHIR spec).
 * Malformed JSON is handled by the service (reported as a structural issue), not
 * a 400 — `$validate` never throws.
 */
export function registerValidationRoutes<E extends Env>(app: Hono<E>, deps: HttpDeps): void {
  app.post('/:type/$validate', async (c) => {
    if (!deps.validation) {
      return c.json({ error: 'Validation service not configured' }, 404);
    }
    requireFhirContentType(c.req.header('content-type'));
    requireResourceType(c.req.param('type'));

    // Read + JSON-parse the body; if malformed, pass the raw string to validate
    // (the service reports it as a structural issue — $validate always returns 200).
    const text = await c.req.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    const outcome = deps.validation.validate(body);
    return fhirResponse(outcome);
  });
}
