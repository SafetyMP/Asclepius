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
  // Typed loosely to avoid a Bundle↔BundleEntry cycle and because OperationOutcome
  // body isn't zod-modeled here; passthrough preserves it (ADR 0011).
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
  // Signature datatype not yet modeled (ADR 0002 subset); passthrough preserves it (ADR 0011).
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

/**
 * Build a `history` Bundle from a list of versioned resource snapshots (newest
 * first, as a repository's `history()` returns).
 *
 * Approximation: the in-memory version chain does not record the operation that
 * produced each version, so the entry `request.method` / `response.status` are
 * derived — versionId `'1'` is treated as a `POST`/201 (create), anything else
 * as a `PUT`/200 (update). Re-create-after-delete (which continues the chain)
 * would therefore be mislabelled as an update; a production store would record
 * the real method per version. Soft-deleted resources produce no tombstone
 * version, so they do not appear in history.
 */
export function historyBundle(versions: FhirResource[]): Bundle {
  return {
    resourceType: 'Bundle',
    type: 'history',
    total: versions.length,
    entry: versions.map((resource) => {
      const versionId = resource.meta?.versionId ?? '';
      const lastUpdated = resource.meta?.lastUpdated ?? '';
      const id = resource.id ?? '';
      const url = `${resource.resourceType}/${id}`;
      const method: 'POST' | 'PUT' = versionId === '1' ? 'POST' : 'PUT';
      return {
        fullUrl: url,
        resource,
        request: { method, url },
        response: {
          status: method === 'POST' ? '201' : '200',
          etag: `W/"${versionId}"`,
          lastModified: lastUpdated,
        },
      };
    }),
  };
}
