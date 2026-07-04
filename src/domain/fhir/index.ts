/**
 * FHIR domain model — single export surface for the resource layer.
 *
 * Re-exports primitives, complex datatypes, resource base shapes, the resource
 * union + registry, and Bundle. Everything downstream (repository, search, HTTP,
 * CDS, DDI) depends on these and nothing else in `domain`.
 */

export {
  type Bundle,
  type BundleEntry,
  type BundleType,
  bundle,
  bundleEntry,
  bundleEntryRequest,
  bundleEntryResponse,
  bundleEntrySearch,
  bundleLink,
  bundleType,
  searchsetBundle,
} from './bundle';
export * from './datatypes';
export * from './operation-outcome';
export * from './primitives';
export * from './resource';
export * from './resources';
export {
  type FhirResource,
  isSupportedResourceType,
  parseResource,
  type ResourceSchemaMap,
  resourceSchemaByType,
  resourceUnion,
  schemaForResourceType,
} from './union';
