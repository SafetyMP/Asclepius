import { z } from 'zod';
import type { ResourceType } from './resource';
import {
  allergyIntolerance,
  condition,
  diagnosticReport,
  encounter,
  medicationRequest,
  observation,
  organization,
  patient,
  practitioner,
} from './resources';

/**
 * The discriminated union of all supported FHIR resources, keyed on
 * `resourceType`. This is the canonical "any resource" type used across the
 * platform (Bundle entries, repository, HTTP payloads).
 */
export const resourceUnion = z.discriminatedUnion('resourceType', [
  patient,
  practitioner,
  organization,
  encounter,
  condition,
  observation,
  medicationRequest,
  allergyIntolerance,
  diagnosticReport,
]);

export type FhirResource = z.infer<typeof resourceUnion>;

/**
 * Lookup table: resourceType → its zod schema. The repository and HTTP layers
 * use this to validate an incoming resource once they know its type, and to
 * enumerate supported types. Single source of truth alongside the union.
 */
export const resourceSchemaByType = {
  Patient: patient,
  Practitioner: practitioner,
  Organization: organization,
  Encounter: encounter,
  Condition: condition,
  Observation: observation,
  MedicationRequest: medicationRequest,
  AllergyIntolerance: allergyIntolerance,
  DiagnosticReport: diagnosticReport,
} as const satisfies Record<ResourceType, z.ZodType>;

export type ResourceSchemaMap = typeof resourceSchemaByType;

/** Schema for a given resourceType string, or undefined if unsupported. */
export function schemaForResourceType(rt: string): z.ZodType | undefined {
  return resourceSchemaByType[rt as ResourceType];
}

/** Type-guard: is this string one of the supported resourceTypes? */
export function isSupportedResourceType(rt: string): rt is ResourceType {
  return rt in resourceSchemaByType;
}

/**
 * Parse/validate an unknown value as the resource matching its declared
 * resourceType. Throws the resource's zod error if invalid; throws a plain
 * Error for an unknown/missing resourceType.
 */
export function parseResource(input: unknown): FhirResource {
  if (typeof input !== 'object' || input === null) {
    throw new Error('resource must be an object');
  }
  const rt = (input as { resourceType?: unknown }).resourceType;
  if (typeof rt !== 'string' || !isSupportedResourceType(rt)) {
    throw new Error(`unsupported resourceType: ${String(rt)}`);
  }
  return resourceSchemaByType[rt].parse(input) as FhirResource;
}
