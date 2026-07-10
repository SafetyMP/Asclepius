import type { AllergyIntolerance, Condition, MedicationRequest, Observation } from '@/domain/fhir';
import type { CdsCard } from '@/port/cds';

/**
 * CDS service types — internal to `@/service/cds` (not the port).
 * `CdsCard` (the output shape) lives in `@/port/cds` so the HTTP adapter
 * imports the port, not the service.
 */

/** CDS Hooks hook types. */
export type CdsHook = 'patient-view' | 'medication-prescribe' | 'order-select' | 'order-sign';

/** The patient's clinical record that rules evaluate against. */
export interface PatientContext {
  readonly patientId: string;
  readonly conditions: readonly Condition[];
  readonly medicationRequests: readonly MedicationRequest[];
  readonly allergies: readonly AllergyIntolerance[];
  readonly observations: readonly Observation[];
}

/** A CDS rule — a pure function `(ctx) → CdsCard[]` with metadata. */
export interface CdsRule {
  readonly id: string;
  readonly title: string;
  readonly hook: CdsHook;
  readonly evaluate: (ctx: PatientContext) => readonly CdsCard[];
}
