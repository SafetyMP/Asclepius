import type { Hono } from 'hono';
import { ForbiddenError } from '@/errors';
import { canAccessPatient } from '@/service/auth/policy';
import type { AppVariables, HttpDeps } from '../app';

/**
 * CDS Hooks endpoint — `POST /cds-services/:id` (ADR 0007).
 *
 * Evaluates CDS rules for a patient and returns CDS Hooks cards. The `{id}`
 * path param is accepted for CDS Hooks compatibility but currently evaluates
 * ALL registered rules (per-rule filtering is a future enhancement).
 *
 * Response content-type is `application/json` (CDS Hooks standard, not
 * `application/fhir+json`).
 */
export function registerCdsRoutes(app: Hono<{ Variables: AppVariables }>, deps: HttpDeps): void {
  app.post('/cds-services/:id', async (c) => {
    if (!deps.cds) {
      return c.json({ error: 'CDS service not configured' }, 501);
    }
    const ctx = c.get('authCtx');
    if (!ctx) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = (await c.req.json().catch(() => null)) as {
      context?: { patientId?: unknown };
    } | null;
    const patientId = body?.context?.patientId;
    if (typeof patientId !== 'string') {
      return c.json({ error: 'Missing or invalid context.patientId' }, 400);
    }
    if (!canAccessPatient(ctx, patientId)) {
      throw new ForbiddenError('Patient compartment violation');
    }
    const result = await deps.cds.evaluate(patientId, deps.repo);
    return c.json({ cards: result.cards });
  });
}
