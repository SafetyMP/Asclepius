import type { CodeableConcept } from '@/domain/fhir';
import type { InteractionSeverity } from '@/port/ddi';

export type {
  DrugInteraction,
  DrugInteractionAlert,
  InteractionSeverity,
} from '@/port/ddi';

/** Internal: sorted pair key for bidirectional lookup. */
export type PairKey = string;

/** Map severity → CDS Hooks card indicator. */
export function severityToIndicator(
  severity: InteractionSeverity,
): 'critical' | 'warning' | 'info' {
  switch (severity) {
    case 'contraindicated':
    case 'major':
      return 'critical';
    case 'moderate':
      return 'warning';
    default:
      return 'info';
  }
}

/** Extract coding codes from a CodeableConcept (handles undefined coding/code). */
export function codesOf(concept: CodeableConcept | undefined): string[] {
  if (concept?.coding === undefined) return [];
  return concept.coding.map((c) => c.code).filter((c): c is string => c !== undefined);
}

/** Build a sorted pair key from two codes (guarantees A+B ≡ B+A). */
export function pairKey(a: string, b: string): PairKey {
  return a < b ? `${a}\x00${b}` : `${b}\x00${a}`;
}
