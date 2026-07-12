import type { MedicationRequest } from '@/domain/fhir';
import type { DdiChecker, DrugInteraction, DrugInteractionAlert } from '@/port/ddi';
import { buildInteractionMap, drugInteractions } from './knowledge-base';
import { pairKey } from './types';

/**
 * Create a `DdiChecker` that evaluates a medication list against the knowledge
 * base. Pure: no I/O, no side effects. Matches active meds' codes bidirectionally
 * via sorted pair keys.
 */
export function createDdiChecker(
  interactions: readonly DrugInteraction[] = drugInteractions,
): DdiChecker {
  const map = buildInteractionMap(interactions);

  return {
    check(medications: readonly MedicationRequest[]): readonly DrugInteractionAlert[] {
      // Filter to active meds (absent status = active, conservative for safety).
      const active = medications.filter((m) => m.status === 'active' || m.status === undefined);

      // Collect all codes + their display names from active meds.
      const codeToDisplay = new Map<string, string>();
      for (const med of active) {
        const coding = med.medicationCodeableConcept?.coding;
        if (coding === undefined) continue;
        for (const c of coding) {
          if (c.code !== undefined) {
            codeToDisplay.set(c.code, c.display ?? c.code);
          }
        }
      }

      // Check all unique sorted pairs against the KB.
      const codes = [...codeToDisplay.keys()];
      const alerts: DrugInteractionAlert[] = [];
      for (let i = 0; i < codes.length; i++) {
        for (let j = i + 1; j < codes.length; j++) {
          const a = codes[i];
          const b = codes[j];
          if (a === undefined || b === undefined) continue;
          const found = map.get(pairKey(a, b));
          if (found) {
            alerts.push({
              interaction: found,
              drugADisplay: codeToDisplay.get(found.drugACode) ?? found.drugACode,
              drugBDisplay: codeToDisplay.get(found.drugBCode) ?? found.drugBCode,
            });
          }
        }
      }
      return alerts;
    },
  };
}
