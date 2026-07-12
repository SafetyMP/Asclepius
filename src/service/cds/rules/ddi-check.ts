import { randomUUID } from 'node:crypto';
import type { CdsCard } from '@/port/cds';
import { createDdiChecker } from '@/service/ddi/checker';
import { severityToIndicator } from '@/service/ddi/types';
import type { CdsRule, PatientContext } from '../types';

/** Module-scope checker instance (static KB; no I/O). */
const checker = createDdiChecker();

/**
 * DDI CDS rule — evaluates the patient's active medication list against the
 * drug–drug interaction knowledge base and emits CDS Hooks cards for each
 * detected interaction. Severity maps to card indicator (major → critical,
 * moderate → warning, minor → info).
 */
export const ddiCheckRule: CdsRule = {
  id: 'ddi-check',
  title: 'Drug–Drug Interaction Check',
  hook: 'patient-view',
  evaluate(ctx: PatientContext): readonly CdsCard[] {
    return checker.check(ctx.medicationRequests).map((alert) => ({
      uuid: randomUUID(),
      summary: `${alert.interaction.severity.toUpperCase()}: ${alert.interaction.description}`,
      indicator: severityToIndicator(alert.interaction.severity),
      detail: `${alert.drugADisplay} + ${alert.drugBDisplay}: ${alert.interaction.mechanism}`,
      source: { label: 'Asclepius DDI' },
    }));
  },
};
