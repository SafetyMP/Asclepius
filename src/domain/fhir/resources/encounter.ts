import { z } from 'zod';
import { codeableConcept, coding, identifier, period, quantity, reference } from '../datatypes';
import { code } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/**
 * Encounter — an interaction between a patient and healthcare provider(s).
 * http://hl7.org/fhir/encounter.html
 */
export const encounterStatus = z.enum([
  'planned',
  'arrived',
  'triaged',
  'in-progress',
  'onleave',
  'finished',
  'cancelled',
  'entered-in-error',
  'unknown',
]);

export const encounterParticipant = z.object({
  type: z.array(codeableConcept).optional(),
  period: period.optional(),
  individual: reference.optional(),
});

export const encounterDiagnosis = z.object({
  condition: reference,
  use: codeableConcept.optional(),
  rank: z.number().int().positive().optional(),
});

export const encounterLocation = z.object({
  location: reference,
  status: code.optional(),
  physicalType: codeableConcept.optional(),
  period: period.optional(),
});

export const encounter = z.object({
  resourceType: z.literal('Encounter'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  status: encounterStatus,
  statusHistory: z.array(z.object({ status: encounterStatus, period: period })).optional(),
  class: coding,
  classHistory: z.array(z.object({ class: coding, period: period })).optional(),
  type: z.array(codeableConcept).optional(),
  serviceType: codeableConcept.optional(),
  priority: codeableConcept.optional(),
  subject: reference.optional(),
  episodeOfCare: z.array(reference).optional(),
  basedOn: z.array(reference).optional(),
  participant: z.array(encounterParticipant).optional(),
  appointment: z.array(reference).optional(),
  reasonCode: z.array(codeableConcept).optional(),
  reasonReference: z.array(reference).optional(),
  diagnosis: z.array(encounterDiagnosis).optional(),
  account: z.array(reference).optional(),
  period: period.optional(),
  length: quantity.optional(),
  location: z.array(encounterLocation).optional(),
  serviceProvider: reference.optional(),
  partOf: reference.optional(),
});
export type Encounter = z.infer<typeof encounter>;
