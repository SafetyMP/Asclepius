import { z } from 'zod';
import { atMostOne } from '../choice';
import { annotation, codeableConcept, identifier, period, reference } from '../datatypes';
import { fhirDateTime } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/** Limited referral-request teaching subset of https://hl7.org/fhir/R4/servicerequest.html. */
export const serviceRequestStatus = z.enum([
  'draft',
  'active',
  'on-hold',
  'revoked',
  'completed',
  'entered-in-error',
  'unknown',
]);
export const serviceRequestIntent = z.enum([
  'proposal',
  'plan',
  'directive',
  'order',
  'original-order',
  'reflex-order',
  'filler-order',
  'instance-order',
  'option',
]);

export const serviceRequest = z
  .object({
    resourceType: z.literal('ServiceRequest'),
    ...baseDomainResourceShape,
    identifier: z.array(identifier).optional(),
    basedOn: z.array(reference).optional(),
    status: serviceRequestStatus,
    intent: serviceRequestIntent,
    code: codeableConcept.optional(),
    orderDetail: z.array(codeableConcept).optional(),
    subject: reference,
    encounter: reference.optional(),
    occurrenceDateTime: fhirDateTime.optional(),
    occurrencePeriod: period.optional(),
    authoredOn: fhirDateTime.optional(),
    requester: reference.optional(),
    performer: z.array(reference).optional(),
    reasonCode: z.array(codeableConcept).optional(),
    reasonReference: z.array(reference).optional(),
    supportingInfo: z.array(reference).optional(),
    note: z.array(annotation).optional(),
  })
  .superRefine((value, ctx) => {
    atMostOne(value, ctx, 'ServiceRequest.occurrence[x]', [
      'occurrenceDateTime',
      'occurrencePeriod',
    ]);
    if (value.orderDetail && value.orderDetail.length > 0 && !value.code) {
      ctx.addIssue({
        code: 'custom',
        path: ['orderDetail'],
        message: 'ServiceRequest.orderDetail requires code',
      });
    }
  });

export type ServiceRequest = z.infer<typeof serviceRequest>;
