import { z } from 'zod';
import {
  address,
  codeableConcept,
  contactPoint,
  humanName,
  identifier,
  reference,
} from '../datatypes';
import { fhirBoolean, fhirDate, fhirDateTime } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/**
 * Patient — the central subject of clinical data.
 * http://hl7.org/fhir/patient.html
 */
export const administrativeGender = z.enum(['male', 'female', 'other', 'unknown']);

export const patient = z.object({
  resourceType: z.literal('Patient'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  active: fhirBoolean.optional(),
  name: z.array(humanName).optional(),
  telecom: z.array(contactPoint).optional(),
  gender: administrativeGender.optional(),
  birthDate: fhirDate.optional(),
  deceasedBoolean: fhirBoolean.optional(),
  deceasedDateTime: fhirDateTime.optional(),
  address: z.array(address).optional(),
  maritalStatus: codeableConcept.optional(),
  multipleBirthBoolean: fhirBoolean.optional(),
  multipleBirthInteger: z.number().int().optional(),
  generalPractitioner: z.array(reference).optional(),
  managingOrganization: reference.optional(),
});
export type Patient = z.infer<typeof patient>;
