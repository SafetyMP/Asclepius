import { describe, expect, it } from 'vitest';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import type { FhirResource } from '@/domain/fhir';
import { createDdiChecker } from '@/service/ddi/checker';
import { search } from '@/service/search';

function makeApp(): {
  app: ReturnType<typeof createHttpApp>;
  repo: InMemoryResourceRepository;
} {
  const repo = new InMemoryResourceRepository();
  const ddi = createDdiChecker();
  return { app: createHttpApp({ repo, search, ddi }), repo };
}

function seedMed(repo: InMemoryResourceRepository, patientId: string, code: string): void {
  repo.create({
    resourceType: 'MedicationRequest',
    intent: 'order',
    subject: { reference: `Patient/${patientId}` },
    status: 'active',
    medicationCodeableConcept: { coding: [{ code }] },
  } as FhirResource);
}

describe('DDI HTTP endpoint', () => {
  it('returns interactions for a patient with conflicting meds', async () => {
    const { app, repo } = makeApp();
    seedMed(repo, 'p1', '11289'); // warfarin
    seedMed(repo, 'p1', '36567'); // ibuprofen

    const res = await app.request('/MedicationRequest/$check-interactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patientId: 'p1' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      interactions: { interaction: { severity: string } }[];
    };
    expect(body.interactions.length).toBeGreaterThanOrEqual(1);
    expect(body.interactions[0]?.interaction.severity).toBe('major');
  });

  it('returns empty interactions for a patient with no conflicts', async () => {
    const { app } = makeApp();
    const res = await app.request('/MedicationRequest/$check-interactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patientId: 'p1' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { interactions: unknown[] };
    expect(body.interactions).toHaveLength(0);
  });

  it('returns 400 when patientId is missing', async () => {
    const { app } = makeApp();
    const res = await app.request('/MedicationRequest/$check-interactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 when DDI is not configured', async () => {
    const repo = new InMemoryResourceRepository();
    const app = createHttpApp({ repo, search });
    const res = await app.request('/MedicationRequest/$check-interactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patientId: 'p1' }),
    });
    expect(res.status).toBe(404);
  });
});
