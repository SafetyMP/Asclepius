import { z } from 'zod';
import {
  canonical,
  code,
  fhirBoolean,
  fhirDate,
  fhirDateTime,
  fhirDecimal,
  fhirInstant,
  fhirInteger,
  fhirString,
  id,
  positiveInt,
  uri,
} from './primitives';

/**
 * FHIR R4 complex datatypes, as zod schemas.
 *
 * These are the most-reused structures in FHIR — every resource is built from
 * them. We model the fields the supported resources actually use; this is a
 * deliberate subset (see ADR 0002), not full R4.
 *
 * Cycles (Reference ↔ Identifier, Extension self-reference) are broken with
 * `z.lazy`, whose factory runs at parse time — after the module is initialized.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Coding & CodeableConcept — the backbone of clinical terminology in FHIR
// ─────────────────────────────────────────────────────────────────────────────

export const coding = z.object({
  system: uri.optional(),
  version: fhirString.optional(),
  code: code.optional(),
  display: fhirString.optional(),
  userSelected: fhirBoolean.optional(),
});
export type Coding = z.infer<typeof coding>;

export const codeableConcept = z.object({
  coding: z.array(coding).optional(),
  text: fhirString.optional(),
});
export type CodeableConcept = z.infer<typeof codeableConcept>;

// ─────────────────────────────────────────────────────────────────────────────
// Period, Quantity, Range, Ratio
// ─────────────────────────────────────────────────────────────────────────────

export const period = z.object({
  start: fhirDateTime.optional(),
  end: fhirDateTime.optional(),
});
export type Period = z.infer<typeof period>;

export const quantityComparator = z.enum(['<', '<=', '>=', '>']);

export const quantity = z.object({
  value: fhirDecimal.optional(),
  comparator: quantityComparator.optional(),
  unit: fhirString.optional(),
  system: uri.optional(),
  code: code.optional(),
});
export type Quantity = z.infer<typeof quantity>;

/** SimpleQuantity: a Quantity without a comparator (used in Range, etc.). */
export const simpleQuantity = quantity.omit({ comparator: true });
export type SimpleQuantity = z.infer<typeof simpleQuantity>;

export const range = z.object({
  low: simpleQuantity.optional(),
  high: simpleQuantity.optional(),
});
export type Range = z.infer<typeof range>;

export const ratio = z.object({
  numerator: quantity.optional(),
  denominator: quantity.optional(),
});
export type Ratio = z.infer<typeof ratio>;

// ─────────────────────────────────────────────────────────────────────────────
// Reference & Identifier — mutually recursive (Identifier.assigner → Reference,
// Reference.identifier → Identifier). Recursive zod types need explicit
// interfaces (TS evaluates them lazily) + a `z.ZodType<T>` annotation on the
// schema; a bare z.object would infer as `any` through the cycle.
// ─────────────────────────────────────────────────────────────────────────────

export const identifierUse = z.enum(['usual', 'official', 'temp', 'secondary', 'old']);

export interface Identifier {
  use?: z.infer<typeof identifierUse> | undefined;
  type?: CodeableConcept | undefined;
  system?: string | undefined;
  value?: string | undefined;
  period?: Period | undefined;
  assigner?: Reference | undefined;
}

export interface Reference {
  /** Literal reference, e.g. "Patient/123" or "urn:uuid:...". */
  reference?: string | undefined;
  /** Resource type the reference targets (a canonical URL). */
  type?: string | undefined;
  /** Logical identifier, when the reference is not literal. */
  identifier?: Identifier | undefined;
  display?: string | undefined;
}

export const reference: z.ZodType<Reference> = z.object({
  reference: fhirString.optional(),
  type: uri.optional(),
  identifier: z.lazy(() => identifier).optional(),
  display: fhirString.optional(),
});

export const identifier: z.ZodType<Identifier> = z.object({
  use: identifierUse.optional(),
  type: codeableConcept.optional(),
  system: uri.optional(),
  value: fhirString.optional(),
  period: period.optional(),
  assigner: reference.optional(),
});

export const codeableReference = z.object({
  concept: codeableConcept.optional(),
  reference: reference.optional(),
});
export type CodeableReference = z.infer<typeof codeableReference>;

// ─────────────────────────────────────────────────────────────────────────────
// HumanName, Address, ContactPoint
// ─────────────────────────────────────────────────────────────────────────────

export const nameUse = z.enum([
  'usual',
  'official',
  'temp',
  'nickname',
  'anonymous',
  'old',
  'maiden',
]);

export const humanName = z.object({
  use: nameUse.optional(),
  text: fhirString.optional(),
  family: fhirString.optional(),
  given: z.array(fhirString).optional(),
  prefix: z.array(fhirString).optional(),
  suffix: z.array(fhirString).optional(),
  period: period.optional(),
});
export type HumanName = z.infer<typeof humanName>;

export const addressUse = z.enum(['home', 'work', 'temp', 'old', 'billing']);
export const addressType = z.enum(['postal', 'physical', 'both']);

export const address = z.object({
  use: addressUse.optional(),
  type: addressType.optional(),
  text: fhirString.optional(),
  line: z.array(fhirString).optional(),
  city: fhirString.optional(),
  district: fhirString.optional(),
  state: fhirString.optional(),
  postalCode: fhirString.optional(),
  country: fhirString.optional(),
  period: period.optional(),
});
export type Address = z.infer<typeof address>;

export const contactPointSystem = z.enum(['phone', 'fax', 'email', 'pager', 'url', 'sms', 'other']);
export const contactPointUse = z.enum(['home', 'work', 'temp', 'old', 'mobile']);

export const contactPoint = z.object({
  system: contactPointSystem.optional(),
  value: fhirString.optional(),
  use: contactPointUse.optional(),
  rank: positiveInt.optional(),
  period: period.optional(),
});
export type ContactPoint = z.infer<typeof contactPoint>;

// ─────────────────────────────────────────────────────────────────────────────
// Meta, Attachment, Annotation
// ─────────────────────────────────────────────────────────────────────────────

export const meta = z.object({
  versionId: id.optional(),
  lastUpdated: fhirInstant.optional(),
  source: uri.optional(),
  profile: z.array(canonical).optional(),
  security: z.array(coding).optional(),
  tag: z.array(coding).optional(),
});
export type Meta = z.infer<typeof meta>;

export const attachment = z.object({
  contentType: code.optional(),
  language: code.optional(),
  data: fhirString.optional(),
  url: uri.optional(),
  size: positiveInt.optional(),
  hash: fhirString.optional(),
  title: fhirString.optional(),
  creation: fhirDateTime.optional(),
});
export type Attachment = z.infer<typeof attachment>;

export const annotation = z.object({
  authorReference: reference.optional(),
  authorString: fhirString.optional(),
  time: fhirDateTime.optional(),
  text: fhirString,
});
export type Annotation = z.infer<typeof annotation>;

// ─────────────────────────────────────────────────────────────────────────────
// Extension — self-recursive (an extension may carry nested extensions). We
// model a pragmatic subset of value[x] choices.
// ─────────────────────────────────────────────────────────────────────────────

export interface Extension {
  url: string;
  valueString?: string | undefined;
  valueBoolean?: boolean | undefined;
  valueInteger?: number | undefined;
  valueDecimal?: number | undefined;
  valueDateTime?: string | undefined;
  valueDate?: string | undefined;
  valueCode?: string | undefined;
  valueQuantity?: Quantity | undefined;
  valueCodeableConcept?: CodeableConcept | undefined;
  extension?: Extension[] | undefined;
}
export const extension: z.ZodType<Extension> = z.lazy(() =>
  z.object({
    url: uri,
    valueString: fhirString.optional(),
    valueBoolean: fhirBoolean.optional(),
    valueInteger: fhirInteger.optional(),
    valueDecimal: fhirDecimal.optional(),
    valueDateTime: fhirDateTime.optional(),
    valueDate: fhirDate.optional(),
    valueCode: code.optional(),
    valueQuantity: quantity.optional(),
    valueCodeableConcept: codeableConcept.optional(),
    extension: z.array(extension).optional(),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Narrative (DomainResource.text) — the human-readable summary.
// ─────────────────────────────────────────────────────────────────────────────

export const narrativeStatus = z.enum(['generated', 'extensions', 'additional', 'empty']);

export const narrative = z.object({
  status: narrativeStatus,
  div: fhirString,
});
export type Narrative = z.infer<typeof narrative>;
