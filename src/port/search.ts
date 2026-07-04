import type { ResourceType } from '@/domain/fhir';
import type { ResourceRepository, StoredResource } from '@/port/repository';

/**
 * Search port.
 *
 * The HTTP adapter depends on this port (not on `@/service/search` directly),
 * keeping the ports-and-adapters invariant honest: an adapter depends on
 * `@/port` + `@/domain` only. The composition root (`src/app.ts`) injects the
 * concrete `search` function from `@/service/search`, which satisfies
 * `SearchFn` structurally.
 */

/** Result of executing a FHIR search against a repository. */
export interface SearchResult {
  /** Matches after sort + pagination. */
  readonly resources: readonly StoredResource[];
  /** Total matches BEFORE pagination (for `Bundle.total`). */
  readonly total: number;
}

/** Execute a FHIR search query string against a repository. */
export type SearchFn = (
  resourceType: ResourceType,
  query: string,
  repo: ResourceRepository,
) => SearchResult;
