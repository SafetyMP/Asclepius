import { describe, expect, it } from 'vitest';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import type { FhirResource } from '@/domain/fhir';
import { cdsRules } from '@/service/cds/rules';
import { createCdsService } from '@/service/cds/service';
import { search } from '@/service/search';

function makeApp(): {
  app: ReturnType<typeof createHttpApp>;
  repo: InMemoryResourceRepository;
} {
  const repo = new InMemoryResourceRepository();
  const cds = createCdsService(cdsRules, search);
  return { app: createHttpApp({ repo, search, cds }), repo };
}

const CDS_REQUEST = JSON.stringify({
  hook: 'patient-view',
  hookInstance: '00000000-0000-0000-0000-000000000000',
  context: { patientId: 'p1' },
});

describe('CDS Hooks HTTP endpoint', () => {
  it('returns cards for a patient with an allergy conflict', async () => {
    const { app, repo } = makeApp();
    repo.create({
      resourceType: 'AllergyIntolerance',
      id: 'a1',
      patient: { reference: 'Patient/p1' },
      code: { coding: [{ code: '1191' }] },
    } as FhirResource);
    repo.create({
      resourceType: 'MedicationRequest',
      id: 'm1',
      intent: 'order',
      subject: { reference: 'Patient/p1' },
      status: 'active',
      medicationCodeableConcept: { coding: [{ code: '1191' }] },
    } as FhirResource);

    const res = await app.request('/cds-services/all', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: CDS_REQUEST,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: { summary: string }[] };
    expect(body.cards.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 when context.patientId is missing', async () => {
    const { app } = makeApp();
    const res = await app.request('/cds-services/all', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hook: 'patient-view', context: {} }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 when CDS is not configured (route not registered)', async () => {
    const repo = new InMemoryResourceRepository();
    const app = createHttpApp({ repo, search });
    const res = await app.request('/cds-services/all', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: CDS_REQUEST,
    });
    expect(res.status).toBe(404);
  });
});
