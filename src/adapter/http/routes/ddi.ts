import type { Env, Hono } from 'hono';
import type { MedicationRequest } from '@/domain/fhir';
import type { HttpDeps } from '../app';

/**
 * DDI HTTP endpoint — `POST /MedicationRequest/$check-interactions`.
 *
 * Fetches the patient's active MedicationRequests via search, evaluates them
 * against the DDI knowledge base, and returns the detected interactions.
 */
export function registerDdiRoutes<E extends Env>(app: Hono<E>, deps: HttpDeps): void {
  app.post('/MedicationRequest/$check-interactions', async (c) => {
    if (!deps.ddi) {
      return c.json({ error: 'DDI service not configured' }, 404);
    }
    const body = (await c.req.json().catch(() => null)) as {
      patientId?: unknown;
    } | null;
    if (typeof body?.patientId !== 'string') {
      return c.json({ error: 'Missing or invalid patientId' }, 400);
    }
    const result = deps.search('MedicationRequest', `patient=${body.patientId}`, deps.repo);
    const meds = result.resources as unknown as readonly MedicationRequest[];
    const alerts = deps.ddi.check(meds);
    return c.json({ interactions: alerts });
  });
}
