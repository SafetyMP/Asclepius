import type { ResourceRepository } from '@/port/repository';

/**
 * CDS port — Clinical Decision Support evaluation (ADR 0007).
 *
 * The HTTP adapter calls this port; the composition root injects the concrete
 * service (`createCdsService` from `@/service/cds`). `CdsCard` is the output
 * type (CDS Hooks card shape).
 */

export type CdsIndicator = 'info' | 'warning' | 'critical';

export interface CdsSource {
  readonly label: string;
  readonly url?: string;
}

/** A CDS Hooks card — the alert/action emitted by a rule. */
export interface CdsCard {
  readonly uuid: string;
  readonly summary: string;
  readonly indicator: CdsIndicator;
  readonly detail?: string;
  readonly source?: CdsSource;
}

/**
 * Evaluate CDS rules for a patient. Returns CDS Hooks cards.
 * The service builds a PatientContext (via search), evaluates all registered
 * rules, and collects their emitted cards.
 */
export interface CdsService {
  evaluate(
    patientId: string,
    repo: ResourceRepository,
  ): Promise<{ readonly cards: readonly CdsCard[] }>;
}
