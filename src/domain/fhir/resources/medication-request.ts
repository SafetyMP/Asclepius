import { z } from 'zod';
import {
  annotation,
  codeableConcept,
  identifier,
  period,
  quantity,
  ratio,
  reference,
} from '../datatypes';
import { code, fhirBoolean, fhirDateTime } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/**
 * MedicationRequest — an order/request for medication supply + instructions.
 * http://hl7.org/fhir/medicationrequest.html
 */

/** Dosage backbone (pragmatic subset). */
export const dosage = z.object({
  sequence: z.number().int().positive().optional(),
  text: z.string().optional(),
  additionalInstruction: z.array(codeableConcept).optional(),
  patientInstruction: z.string().optional(),
  timing: z.object({}).passthrough().optional(),
  asNeededBoolean: fhirBoolean.optional(),
  asNeededCodeableConcept: codeableConcept.optional(),
  site: codeableConcept.optional(),
  route: codeableConcept.optional(),
  method: codeableConcept.optional(),
  doseAndRate: z
    .array(
      z.object({
        type: codeableConcept.optional(),
        doseQuantity: quantity.optional(),
        doseRange: z.object({ low: quantity.optional(), high: quantity.optional() }).optional(),
        rateQuantity: quantity.optional(),
        rateRatio: ratio.optional(),
      }),
    )
    .optional(),
  maxDosePerPeriod: z
    .array(
      z.object({
        numerator: quantity.optional(),
        denominator: quantity.optional(),
      }),
    )
    .optional(),
});

export const medicationRequestStatus = z.enum([
  'active',
  'on-hold',
  'cancelled',
  'completed',
  'entered-in-error',
  'stopped',
  'draft',
  'unknown',
]);

export const medicationRequestIntent = z.enum([
  'proposal',
  'plan',
  'order',
  'original-order',
  'reflex-order',
  'filler-order',
  'instance-order',
  'option',
]);

export const medicationRequest = z.object({
  resourceType: z.literal('MedicationRequest'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  status: medicationRequestStatus.optional(),
  statusReason: codeableConcept.optional(),
  intent: medicationRequestIntent,
  category: z.array(codeableConcept).optional(),
  priority: code.optional(),
  doNotPerform: fhirBoolean.optional(),
  // medication[x]: CodeableConcept (coded med) OR Reference (contained med)
  medicationCodeableConcept: codeableConcept.optional(),
  medicationReference: reference.optional(),
  subject: reference,
  encounter: reference.optional(),
  supportingInformation: z.array(reference).optional(),
  authoredOn: fhirDateTime.optional(),
  requester: reference.optional(),
  performer: reference.optional(),
  performerType: codeableConcept.optional(),
  recorder: reference.optional(),
  reasonCode: z.array(codeableConcept).optional(),
  reasonReference: z.array(reference).optional(),
  instantiatesCanonical: z.array(z.string()).optional(),
  instantiatesUri: z.array(z.string()).optional(),
  basedOn: z.array(reference).optional(),
  groupIdentifier: identifier.optional(),
  courseOfTherapyType: codeableConcept.optional(),
  insurance: z.array(reference).optional(),
  note: z.array(annotation).optional(),
  dosageInstruction: z.array(dosage).optional(),
  dispenseRequest: z
    .object({
      initialFill: z
        .object({ quantity: quantity.optional(), duration: period.optional() })
        .optional(),
      dispenseInterval: period.optional(),
      validityPeriod: period.optional(),
      numberOfRepeatsAllowed: z.number().int().nonnegative().optional(),
      quantity: quantity.optional(),
      expectedSupplyDuration: z.object({}).passthrough().optional(),
      performer: reference.optional(),
    })
    .optional(),
  substitution: z
    .object({
      allowedBoolean: fhirBoolean.optional(),
      allowedCodeableConcept: codeableConcept.optional(),
      reason: codeableConcept.optional(),
    })
    .optional(),
  priorPrescription: reference.optional(),
  detectedIssue: z.array(reference).optional(),
  eventHistory: z.array(reference).optional(),
});
export type MedicationRequest = z.infer<typeof medicationRequest>;
