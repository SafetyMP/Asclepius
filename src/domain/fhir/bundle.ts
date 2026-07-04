import { z } from 'zod';
import { identifier } from './datatypes';
import { fhirInstant, fhirString, unsignedInt, uri } from './primitives';
import { baseResourceShape } from './resource';
import { type FhirResource, resourceUnion } from './union';

/**
 * Bundle — a collection of resources with a defined meaning.
 * http://hl7.org/fhir/bundle.html
 *
 * Bundles carry search results, transactions, history, messages, documents.
 * Each entry may carry a `resource` (validated by the resource union),
 * `fullUrl`, and a `search`/`request`/`response` block depending on Bundle.type.
 */
export const bundleType = z.enum([
  'document',
  'message',
  'transaction',
  'transaction-response',
  'batch',
  'batch-response',
  'history',
  'searchset',
  'collection',
]);

export const bundleLink = z.object({
  relation: fhirString,
  url: uri,
});

export const bundleEntrySearch = z.object({
  mode: z.enum(['match', 'include', 'outcome']),
  score: z.number().optional(),
});

export const bundleEntryRequest = z.object({
  method: z.enum(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: uri,
  ifNoneMatch: fhirString.optional(),
  ifModifiedSince: fhirInstant.optional(),
  ifMatch: fhirString.optional(),
  ifNoneExist: fhirString.optional(),
});

export const bundleEntryResponse = z.object({
  status: fhirString,
  location: uri.optional(),
  etag: fhirString.optional(),
  lastModified: fhirInstant.optional(),
  // Per FHIR, entry.response.outcome is an OperationOutcome (not a Bundle).
  // Typed loosely here to avoid a Bundle↔BundleEntry cycle; validated where it
  // matters (the HTTP boundary).
  outcome: z
    .object({ resourceType: z.literal('OperationOutcome') })
    .passthrough()
    .optional(),
});

export const bundleEntry = z.object({
  link: z.array(bundleLink).optional(),
  fullUrl: uri.optional(),
  resource: resourceUnion.optional(),
  search: bundleEntrySearch.optional(),
  request: bundleEntryRequest.optional(),
  response: bundleEntryResponse.optional(),
});

export const bundle = z.object({
  resourceType: z.literal('Bundle'),
  ...baseResourceShape,
  identifier: identifier.optional(),
  type: bundleType,
  timestamp: fhirInstant.optional(),
  total: unsignedInt.optional(),
  link: z.array(bundleLink).optional(),
  entry: z.array(bundleEntry).optional(),
  signature: z.object({}).passthrough().optional(),
});

export type Bundle = z.infer<typeof bundle>;
export type BundleEntry = z.infer<typeof bundleEntry>;
export type BundleType = z.infer<typeof bundleType>;

/** Convenience: build a searchset Bundle from a list of resources. */
export function searchsetBundle(resources: FhirResource[], total?: number): Bundle {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: total ?? resources.length,
    entry: resources.map((resource, i) => ({
      fullUrl: `${resource.resourceType}/${resource.id ?? ''}`.replace(/\/$/, ''),
      resource,
      search: { mode: 'match' as const, score: 1 - i * 0.001 },
    })),
  };
}
