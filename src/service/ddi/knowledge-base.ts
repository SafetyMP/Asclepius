import type { DrugInteraction } from '@/port/ddi';
import type { PairKey } from './types';
import { pairKey } from './types';

/**
 * In-memory DDI knowledge base (ADR 0012).
 *
 * Intentionally incomplete — a reference sample of well-known interactions.
 * Production uses DrugBank / First Databank / RxNorm interaction tables behind
 * the same `DdiChecker` port. Codes are RxNorm (matching the CDS rules).
 */
export const drugInteractions: readonly DrugInteraction[] = [
  {
    drugACode: '11289', // Warfarin
    drugBCode: '36567', // Ibuprofen
    severity: 'major',
    mechanism: 'Pharmacodynamic: antiplatelet + anticoagulant synergism',
    description: 'Concomitant use increases the risk of gastrointestinal bleeding.',
  },
  {
    drugACode: '11289', // Warfarin
    drugBCode: '2412', // Aspirin
    severity: 'major',
    mechanism: 'Pharmacodynamic: antiplatelet + anticoagulant synergism',
    description: 'Concomitant use increases the risk of GI bleeding.',
  },
  {
    drugACode: '855389', // Warfarin Sodium (second RxNorm code)
    drugBCode: '36567', // Ibuprofen
    severity: 'major',
    mechanism: 'Pharmacodynamic: antiplatelet + anticoagulant synergism',
    description: 'Concomitant use increases the risk of gastrointestinal bleeding.',
  },
  {
    drugACode: '11289', // Warfarin
    drugBCode: '11712', // Naproxen
    severity: 'major',
    mechanism: 'Pharmacodynamic: NSAID + anticoagulant synergism',
    description: 'Concomitant use increases the risk of gastrointestinal bleeding.',
  },
  {
    drugACode: '11289', // Warfarin
    drugBCode: '243670', // Diclofenac
    severity: 'major',
    mechanism: 'Pharmacodynamic: NSAID + anticoagulant synergism',
    description: 'Concomitant use increases the risk of gastrointestinal bleeding.',
  },
  {
    drugACode: '11289', // Warfarin
    drugBCode: '358828', // Celecoxib (COX-2, lower GI risk)
    severity: 'moderate',
    mechanism: 'Pharmacodynamic: NSAID + anticoagulant',
    description: 'COX-2 inhibitors carry a lower but still elevated bleeding risk with warfarin.',
  },
];

/** Build a lookup map from the interaction list (sorted pair → interaction). */
export function buildInteractionMap(
  interactions: readonly DrugInteraction[],
): ReadonlyMap<PairKey, DrugInteraction> {
  const map = new Map<PairKey, DrugInteraction>();
  for (const interaction of interactions) {
    map.set(pairKey(interaction.drugACode, interaction.drugBCode), interaction);
  }
  return map;
}
