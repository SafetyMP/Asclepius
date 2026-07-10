import { describe, expect, it } from 'vitest';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import type { FhirResource } from '@/domain/fhir';
import { search } from '@/service/search';
import { cdsRules } from './rules';
import { createCdsService } from './service';

describe('CdsService', () => {
  it('evaluates all rules and returns cards for a patient with conflicts', async () => {
    const repo = new InMemoryResourceRepository();
    repo.create({
      resourceType: 'AllergyIntolerance',
      patient: { reference: 'Patient/p1' },
      code: { coding: [{ code: '1191' }] },
    } as FhirResource);
    repo.create({
      resourceType: 'MedicationRequest',
      intent: 'order',
      subject: { reference: 'Patient/p1' },
      status: 'active',
      medicationCodeableConcept: { coding: [{ code: '1191' }] },
    } as FhirResource);

    const service = createCdsService(cdsRules, search);
    const result = await service.evaluate('p1', repo);
    expect(result.cards.length).toBeGreaterThanOrEqual(1);
    expect(result.cards.some((c) => c.summary.includes('Allergy'))).toBe(true);
  });

  it('returns no cards for a patient with no conflicts', async () => {
    const repo = new InMemoryResourceRepository();
    const service = createCdsService(cdsRules, search);
    const result = await service.evaluate('p1', repo);
    expect(result.cards).toHaveLength(0);
  });
});
