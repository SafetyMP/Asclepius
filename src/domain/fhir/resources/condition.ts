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
 * Condition — a clinical condition, problem, diagnosis, or health event.
 * http://hl7.org/fhir/condition.html
 */
export const conditionClinicalStatus = codeableConcept;
export const conditionVerificationStatus = codeableConcept;

/**
 * Polymorphic onset[x] / abatement[x] are represented as separate optional keys
 * (the FHIR JSON convention). We model the four most-used choices.
 */
const onsetChoice = {
  onsetDateTime: fhirDateTime.optional(),
  onsetAge: quantity.optional(),
  onsetPeriod: period.optional(),
  onsetRange: range.optional(),
  onsetString: fhirString.optional(),
} as const;

const abatementChoice = {
  abatementDateTime: fhirDateTime.optional(),
  abatementAge: quantity.optional(),
  abatementPeriod: period.optional(),
  abatementRange: range.optional(),
  abatementString: fhirString.optional(),
} as const;

export const condition = z.object({
  resourceType: z.literal('Condition'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  clinicalStatus: conditionClinicalStatus.optional(),
  verificationStatus: conditionVerificationStatus.optional(),
  category: z.array(codeableConcept).optional(),
  severity: codeableConcept.optional(),
  code: codeableConcept.optional(),
  bodySite: z.array(codeableConcept).optional(),
  subject: reference,
  encounter: reference.optional(),
  ...onsetChoice,
  ...abatementChoice,
  recordedDate: fhirDateTime.optional(),
  recorder: reference.optional(),
  asserter: reference.optional(),
  stage: z
    .array(
      z.object({
        summary: codeableConcept.optional(),
        assessment: z.array(reference).optional(),
        type: codeableConcept.optional(),
      }),
    )
    .optional(),
  evidence: z
    .array(
      z.object({
        code: z.array(codeableConcept).optional(),
        detail: z.array(reference).optional(),
      }),
    )
    .optional(),
  note: z.array(annotation).optional(),
});
export type Condition = z.infer<typeof condition>;
