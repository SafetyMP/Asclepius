import { z } from 'zod';
import {
  annotation,
  codeableConcept,
  identifier,
  period,
  quantity,
  range,
  reference,
} from '../datatypes';
import { fhirDateTime, fhirString } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/**
 * AllergyIntolerance — risk of harmful reaction to a substance.
 * http://hl7.org/fhir/allergyintolerance.html
 */
export const allergyType = z.enum(['allergy', 'intolerance']);
export const allergyCategory = z.enum(['food', 'medication', 'environment', 'biologic']);
export const allergyCriticality = z.enum(['low', 'high', 'unable-to-assess']);

export const allergyReaction = z.object({
  substance: codeableConcept.optional(),
  manifestation: z.array(codeableConcept),
  onset: fhirDateTime.optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  exposureRoute: codeableConcept.optional(),
  note: z.array(annotation).optional(),
});

export const allergyIntolerance = z.object({
  resourceType: z.literal('AllergyIntolerance'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  clinicalStatus: codeableConcept.optional(),
  verificationStatus: codeableConcept.optional(),
  type: allergyType.optional(),
  category: z.array(allergyCategory).optional(),
  criticality: allergyCriticality.optional(),
  code: codeableConcept.optional(),
  patient: reference,
  encounter: reference.optional(),
  // onset[x] subset
  onsetDateTime: fhirDateTime.optional(),
  onsetAge: quantity.optional(),
  onsetPeriod: period.optional(),
  onsetRange: range.optional(),
  onsetString: fhirString.optional(),
  recordedDate: fhirDateTime.optional(),
  recorder: reference.optional(),
  asserter: reference.optional(),
  lastOccurrence: fhirDateTime.optional(),
  note: z.array(annotation).optional(),
  reaction: z.array(allergyReaction).optional(),
});
export type AllergyIntolerance = z.infer<typeof allergyIntolerance>;
