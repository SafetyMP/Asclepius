import { randomUUID } from 'node:crypto';
import type { CodeableConcept } from '@/domain/fhir';
import type { CdsCard } from '@/port/cds';
import type { CdsRule, PatientContext } from '../types';

/** Extract coding codes from a CodeableConcept (handles undefined coding/code). */
function codesOf(concept: CodeableConcept | undefined): string[] {
  if (concept?.coding === undefined) return [];
  return concept.coding.map((c) => c.code).filter((c): c is string => c !== undefined);
}

/**
 * Drug-Allergy rule — fires when a patient has an active AllergyIntolerance
 * whose code matches an active MedicationRequest's medication code.
 *
 * Code matching is by `coding[].code` only (not system+code pair) — an
 * intentional simplification for the reference implementation. Production CDS
 * would match on (system, code) pairs.
 */
export const drugAllergyRule: CdsRule = {
  id: 'drug-allergy',
  title: 'Drug-Allergy Interaction',
  hook: 'patient-view',
  evaluate(ctx: PatientContext): readonly CdsCard[] {
    const cards: CdsCard[] = [];
    for (const allergy of ctx.allergies) {
      // skip inactive/resolved allergies (absent clinicalStatus = active)
      const status = allergy.clinicalStatus?.coding?.[0]?.code;
      if (status === 'inactive' || status === 'resolved') continue;

      const allergyCodes = new Set(codesOf(allergy.code));
      if (allergyCodes.size === 0) continue;

      for (const med of ctx.medicationRequests) {
        if (med.status === 'cancelled' || med.status === 'stopped') continue;
        const medCodes = codesOf(med.medicationCodeableConcept);
        if (medCodes.some((code) => allergyCodes.has(code))) {
          cards.push({
            uuid: randomUUID(),
            summary: 'Allergy conflict: active medication matches a known allergy.',
            indicator: 'warning',
            source: { label: 'Asclepius CDS' },
          });
        }
      }
    }
    return cards;
  },
};
