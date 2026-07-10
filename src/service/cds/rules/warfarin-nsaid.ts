import { randomUUID } from 'node:crypto';
import type { CodeableConcept } from '@/domain/fhir';
import type { CdsCard } from '@/port/cds';
import type { CdsRule, PatientContext } from '../types';

/** RxNorm code sets (simplified for the reference implementation). */
const WARFARIN_CODES = new Set(['11289', '855389']); // Warfarin, Warfarin Sodium
const NSAID_CODES = new Set([
  '36567', // Ibuprofen
  '11712', // Naproxen
  '2412', // Aspirin
  '243670', // Diclofenac
  '358828', // Celecoxib
]);

function codesOf(concept: CodeableConcept | undefined): string[] {
  if (concept?.coding === undefined) return [];
  return concept.coding.map((c) => c.code).filter((c): c is string => c !== undefined);
}

/**
 * Warfarin + NSAID bleeding-risk rule — fires when a patient is on warfarin
 * AND an NSAID (concomitant use increases gastrointestinal bleeding risk).
 */
export const warfarinNsaidRule: CdsRule = {
  id: 'warfarin-nsaid',
  title: 'Warfarin + NSAID Bleeding Risk',
  hook: 'patient-view',
  evaluate(ctx: PatientContext): readonly CdsCard[] {
    // Treat absent status as active (conservative for safety alerts)
    const activeMeds = ctx.medicationRequests.filter(
      (m) => m.status === 'active' || m.status === undefined,
    );
    const allCodes = activeMeds.flatMap((m) => codesOf(m.medicationCodeableConcept));
    const hasWarfarin = allCodes.some((c) => WARFARIN_CODES.has(c));
    const hasNsaid = allCodes.some((c) => NSAID_CODES.has(c));

    if (hasWarfarin && hasNsaid) {
      return [
        {
          uuid: randomUUID(),
          summary: 'Bleeding risk: patient is on warfarin and an NSAID.',
          indicator: 'warning',
          source: { label: 'Asclepius CDS' },
        },
      ];
    }
    return [];
  },
};
