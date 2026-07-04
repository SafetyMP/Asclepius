import { z } from 'zod';
import { extension, meta, narrative } from './datatypes';
import { code, fhirString, id, uri } from './primitives';

/**
 * Resource base shapes.
 *
 * FHIR distinguishes `Resource` (the root) from `DomainResource` (adds text,
 * contained, extensions). Every concrete resource stamps its own `resourceType`
 * literal — that field is the discriminator for the resource union (see index).
 *
 * Rather than inheritance, resources compose by spreading these shape objects
 * into a flat `z.object`. The inferred TS type is identical to a real
 * inheritance hierarchy, with no class machinery.
 */

/**
 * Loose accept for `contained` resources — must carry a resourceType. Body is
 * passthrough because contained resources may be of a type we don't model;
 * preserving fidelity beats stripping data we can't validate. See ADR 0011.
 */
export const containedResource = z
  .object({
    resourceType: fhirString,
  })
  .passthrough();

/** Fields present on every FHIR Resource (the root). */
export const baseResourceShape = {
  id: id.optional(),
  meta: meta.optional(),
  implicitRules: uri.optional(),
  language: code.optional(),
} as const;

/** Fields present on every DomainResource, layered on top of the root. */
export const baseDomainResourceShape = {
  ...baseResourceShape,
  text: narrative.optional(),
  contained: z.array(containedResource).optional(),
  extension: z.array(extension).optional(),
  modifierExtension: z.array(extension).optional(),
} as const;

/**
 * The set of resourceTypes this reference implementation supports. Kept here so
 * the registry (index.ts) and HTTP routing can enumerate them from one source.
 */
export const SUPPORTED_RESOURCE_TYPES = [
  'Patient',
  'Practitioner',
  'Organization',
  'Encounter',
  'Condition',
  'Observation',
  'MedicationRequest',
  'AllergyIntolerance',
  'DiagnosticReport',
] as const;

export type ResourceType = (typeof SUPPORTED_RESOURCE_TYPES)[number];
