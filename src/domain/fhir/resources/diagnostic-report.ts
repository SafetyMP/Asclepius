import { z } from 'zod';
import { attachment, codeableConcept, identifier, period, reference } from '../datatypes';
import { fhirDateTime, fhirInstant, fhirString } from '../primitives';
import { baseDomainResourceShape } from '../resource';

/**
 * DiagnosticReport — findings & interpretation of diagnostic tests.
 * http://hl7.org/fhir/diagnosticreport.html
 */
export const diagnosticReportStatus = z.enum([
  'registered',
  'partial',
  'preliminary',
  'final',
  'amended',
  'corrected',
  'appended',
  'cancelled',
  'entered-in-error',
  'unknown',
]);

export const diagnosticReport = z.object({
  resourceType: z.literal('DiagnosticReport'),
  ...baseDomainResourceShape,
  identifier: z.array(identifier).optional(),
  basedOn: z.array(reference).optional(),
  status: diagnosticReportStatus,
  category: z.array(codeableConcept).optional(),
  code: codeableConcept,
  subject: reference.optional(),
  encounter: reference.optional(),
  effectiveDateTime: fhirDateTime.optional(),
  effectivePeriod: period.optional(),
  issued: fhirInstant.optional(),
  performer: z.array(reference).optional(),
  resultsInterpreter: z.array(reference).optional(),
  specimen: z.array(reference).optional(),
  /** References to Observation resources that make up this report. */
  result: z.array(reference).optional(),
  imagingStudy: z.array(reference).optional(),
  media: z.array(z.object({ comment: fhirString.optional(), link: reference })).optional(),
  conclusion: fhirString.optional(),
  conclusionCode: z.array(codeableConcept).optional(),
  presentedForm: z.array(attachment).optional(),
});
export type DiagnosticReport = z.infer<typeof diagnosticReport>;
