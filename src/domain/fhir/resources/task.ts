import { z } from 'zod';
import {
  annotation,
  codeableConcept,
  extension,
  identifier,
  period,
  reference,
} from '../datatypes';
import { fhirDateTime, fhirString, id } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/** Limited coordination-task teaching subset of https://hl7.org/fhir/R4/task.html. */
export const taskStatus = z.enum([
  'draft',
  'requested',
  'received',
  'accepted',
  'rejected',
  'ready',
  'cancelled',
  'in-progress',
  'on-hold',
  'failed',
  'completed',
  'entered-in-error',
]);
export const taskIntent = z.enum([
  'unknown',
  'proposal',
  'plan',
  'order',
  'original-order',
  'reflex-order',
  'filler-order',
  'instance-order',
  'option',
]);

/**
 * Only Reference and string values are modeled in this teaching subset.
 * Reject other value[x] choices instead of silently dropping a second value.
 */
export const taskParameter = z
  .object({
    id: id.optional(),
    extension: z.array(extension).optional(),
    modifierExtension: z.array(extension).optional(),
    type: codeableConcept,
    valueReference: reference.optional(),
    valueString: fhirString.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const count = [value.valueReference, value.valueString].filter(
      (choice) => choice !== undefined,
    ).length;
    if (count !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['value[x]'],
        message: 'Task input/output requires exactly one supported value: Reference or string',
      });
    }
  });

export const task = z
  .object({
    resourceType: z.literal('Task'),
    ...baseDomainResourceShape,
    identifier: z.array(identifier).optional(),
    basedOn: z.array(reference).optional(),
    partOf: z.array(reference).optional(),
    status: taskStatus,
    statusReason: codeableConcept.optional(),
    businessStatus: codeableConcept.optional(),
    intent: taskIntent,
    code: codeableConcept.optional(),
    description: fhirString.optional(),
    focus: reference.optional(),
    for: reference.optional(),
    encounter: reference.optional(),
    executionPeriod: period.optional(),
    authoredOn: fhirDateTime.optional(),
    lastModified: fhirDateTime.optional(),
    requester: reference.optional(),
    owner: reference.optional(),
    note: z.array(annotation).optional(),
    input: z.array(taskParameter).optional(),
    output: z.array(taskParameter).optional(),
  })
  .superRefine((value, ctx) => {
    // Compare full timestamps only; partial FHIR dates do not specify an instant.
    if (
      value.authoredOn?.includes('T') &&
      value.lastModified?.includes('T') &&
      Date.parse(value.lastModified) < Date.parse(value.authoredOn)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['lastModified'],
        message: 'Task.lastModified must not precede authoredOn',
      });
    }
  });

export type Task = z.infer<typeof task>;
