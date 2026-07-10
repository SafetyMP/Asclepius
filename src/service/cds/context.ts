import type { AllergyIntolerance, Condition, MedicationRequest, Observation } from '@/domain/fhir';
import type { SearchFn } from '@/port/search';
import type { PatientContext } from './types';

/**
 * Build a PatientContext by searching for the patient's clinical resources.
 * Uses the search port (`patient={id}` reference param) so context building
 * leverages the search engine (layers 3-4) rather than loading every resource.
 *
 * The casts are justified: `search('MedicationRequest', ...)` calls
 * `repo.list('MedicationRequest')` internally, so every element IS a
 * MedicationRequest. StoredResource (union + required id/meta) can't be
 * type-guarded down to a single union member, so we cast.
 */
export async function buildPatientContext(
  patientId: string,
  search: SearchFn,
  repo: Parameters<SearchFn>[2],
): Promise<PatientContext> {
  return {
    patientId,
    allergies: search('AllergyIntolerance', `patient=${patientId}`, repo)
      .resources as unknown as readonly AllergyIntolerance[],
    conditions: search('Condition', `patient=${patientId}`, repo)
      .resources as unknown as readonly Condition[],
    observations: search('Observation', `patient=${patientId}`, repo)
      .resources as unknown as readonly Observation[],
    medicationRequests: search('MedicationRequest', `patient=${patientId}`, repo)
      .resources as unknown as readonly MedicationRequest[],
  };
}
