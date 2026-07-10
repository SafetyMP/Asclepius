import type { CdsCard, CdsService } from '@/port/cds';
import type { ResourceRepository } from '@/port/repository';
import type { SearchFn } from '@/port/search';
import { buildPatientContext } from './context';
import type { CdsRule, PatientContext } from './types';

/**
 * Create a `CdsService` that evaluates a registry of rules against a patient's
 * clinical context. The service builds the context via search, evaluates all
 * registered rules, and collects their emitted cards.
 */
export function createCdsService(registry: readonly CdsRule[], search: SearchFn): CdsService {
  return {
    async evaluate(
      patientId: string,
      repo: ResourceRepository,
    ): Promise<{ readonly cards: readonly CdsCard[] }> {
      const ctx: PatientContext = await buildPatientContext(patientId, search, repo);
      const cards: CdsCard[] = [];
      for (const rule of registry) {
        const emitted = rule.evaluate(ctx);
        cards.push(...emitted);
      }
      return { cards };
    },
  };
}
