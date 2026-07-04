import { z } from 'zod';
import {
  address,
  codeableConcept,
  contactPoint,
  humanName,
  identifier,
  period,
  reference,
} from '../datatypes';
import { fhirBoolean, fhirDate } from '../primitives';
import { baseDomainResourceShape } from '../resource';
import { administrativeGender } from './patient';

/**
 * Practitioner — a person who provides healthcare.
 * http://hl7.org/fhir/practitioner.html
 */
export const qualification = z.object({
  identifier: z.array(identifier).optional(),
  code: codeableConcept,
  period: period.optional(),
  issuer: reference.optional(),
});

export const practitioner = z.object({
  resourceType: z.literal('Practitioner'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  active: fhirBoolean.optional(),
  name: z.array(humanName).optional(),
  telecom: z.array(contactPoint).optional(),
  address: z.array(address).optional(),
  gender: administrativeGender.optional(),
  birthDate: fhirDate.optional(),
  qualification: z.array(qualification).optional(),
});
export type Practitioner = z.infer<typeof practitioner>;
