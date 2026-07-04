import { z } from 'zod';
import {
  annotation,
  codeableConcept,
  identifier,
  period,
  quantity,
  range,
  ratio,
  reference,
} from '../datatypes';
import {
  fhirBoolean,
  fhirDateTime,
  fhirInstant,
  fhirInteger,
  fhirString,
  fhirTime,
} from '../primitives';
import { baseDomainResourceShape } from '../resource';

/**
 * Observation — measurements and simple assertions about a patient.
 * http://hl7.org/fhir/observation.html
 *
 * value[x] polymorphism is modeled as separate optional keys (FHIR JSON
 * convention). For the reference implementation we cover the clinically common
 * value types; the rarer ones (SampledData) are omitted (ADR 0002).
 */
export const observationStatus = z.enum([
  'registered',
  'preliminary',
  'final',
  'amended',
  'corrected',
  'cancelled',
  'entered-in-error',
  'unknown',
]);

export const observationReferenceRange = z.object({
  low: quantity.optional(),
  high: quantity.optional(),
  type: codeableConcept.optional(),
  appliesTo: z.array(codeableConcept).optional(),
  age: range.optional(),
  text: fhirString.optional(),
});

export const observationComponent = z.object({
  code: codeableConcept,
  valueQuantity: quantity.optional(),
  valueCodeableConcept: codeableConcept.optional(),
  valueString: fhirString.optional(),
  valueBoolean: fhirBoolean.optional(),
  valueInteger: fhirInteger.optional(),
  valueRange: range.optional(),
  valueRatio: ratio.optional(),
  valueTime: fhirTime.optional(),
  valueDateTime: fhirDateTime.optional(),
  valuePeriod: period.optional(),
  dataAbsentReason: codeableConcept.optional(),
  interpretation: z.array(codeableConcept).optional(),
  referenceRange: z.array(observationReferenceRange).optional(),
});

export const observation = z.object({
  resourceType: z.literal('Observation'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  basedOn: z.array(reference).optional(),
  partOf: z.array(reference).optional(),
  status: observationStatus,
  category: z.array(codeableConcept).optional(),
  code: codeableConcept,
  subject: reference.optional(),
  focus: z.array(reference).optional(),
  encounter: reference.optional(),
  effectiveDateTime: fhirDateTime.optional(),
  effectivePeriod: period.optional(),
  effectiveInstant: fhirInstant.optional(),
  issued: fhirInstant.optional(),
  performer: z.array(reference).optional(),
  // value[x] — the clinically common subset
  valueQuantity: quantity.optional(),
  valueCodeableConcept: codeableConcept.optional(),
  valueString: fhirString.optional(),
  valueBoolean: fhirBoolean.optional(),
  valueInteger: fhirInteger.optional(),
  valueRange: range.optional(),
  valueRatio: ratio.optional(),
  valueTime: fhirTime.optional(),
  valueDateTime: fhirDateTime.optional(),
  valuePeriod: period.optional(),
  dataAbsentReason: codeableConcept.optional(),
  interpretation: z.array(codeableConcept).optional(),
  note: z.array(annotation).optional(),
  bodySite: codeableConcept.optional(),
  method: codeableConcept.optional(),
  specimen: reference.optional(),
  device: z.array(reference).optional(),
  referenceRange: z.array(observationReferenceRange).optional(),
  hasMember: z.array(reference).optional(),
  derivedFrom: z.array(reference).optional(),
  component: z.array(observationComponent).optional(),
});
export type Observation = z.infer<typeof observation>;
