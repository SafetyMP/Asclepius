import { z } from 'zod';
import { address, codeableConcept, contactPoint, identifier, reference } from '../datatypes';
import { fhirBoolean, fhirString } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/**
 * Organization — a formal or informal group of people or organizations.
 * http://hl7.org/fhir/organization.html
 */
export const organization = z.object({
  resourceType: z.literal('Organization'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  active: fhirBoolean.optional(),
  type: z.array(codeableConcept).optional(),
  name: fhirString.optional(),
  alias: z.array(fhirString).optional(),
  telecom: z.array(contactPoint).optional(),
  address: z.array(address).optional(),
  partOf: reference.optional(),
});
export type Organization = z.infer<typeof organization>;
