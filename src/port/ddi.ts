import type { MedicationRequest } from '@/domain/fhir';

/**
 * DDI port — Drug–Drug Interaction checker (ADR 0012).
 *
 * Pure function: medications in → interaction alerts out. The knowledge base
 * is provided at construction time (static TS module for MVP). The checker
 * matches active medications' codes against the KB bidirectionally (sorted
 * pair keys). No I/O, no side effects.
 *
 * The knowledge base is intentionally incomplete — see README regulatory
 * disclaimer. Production uses a comprehensive clinical drug database (DrugBank,
 * First Databank, etc.) behind this same port.
 */

export type InteractionSeverity = 'contraindicated' | 'major' | 'moderate' | 'minor';

/** A known drug–drug interaction record in the knowledge base. */
export interface DrugInteraction {
  readonly drugACode: string;
  readonly drugBCode: string;
  readonly severity: InteractionSeverity;
  readonly mechanism: string;
  readonly description: string;
}

/** An alert emitted by the checker for a specific patient's medication list. */
export interface DrugInteractionAlert {
  readonly interaction: DrugInteraction;
  readonly drugADisplay: string;
  readonly drugBDisplay: string;
}

/** Evaluate a medication list against the knowledge base → interaction alerts. */
export interface DdiChecker {
  check(medications: readonly MedicationRequest[]): readonly DrugInteractionAlert[];
}
