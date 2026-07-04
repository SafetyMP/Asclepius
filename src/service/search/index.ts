import type { ResourceType } from '@/domain/fhir';
import type { ResourceRepository } from '@/port/repository';
import { executeSearch, type SearchResult } from './executor';
import { parseSearchQuery } from './parser';
import { compilePlan } from './plan';
import type { SearchPlan, SearchRequest } from './types';

export { executeSearch, type SearchResult } from './executor';
export { getParamDefinition, paramNames } from './params';
export { parseSearchQuery } from './parser';
export { compilePlan } from './plan';
export * from './types';

/**
 * Parse + plan in one step: a FHIR search query string → executable SearchPlan.
 * Throws BadRequestError (→ 400/422 OperationOutcome) on unknown params or
 * modifiers. Evaluate the plan with `executeSearch`.
 */
export function compileSearch(resourceType: ResourceType, query: string): SearchPlan {
  const request: SearchRequest = parseSearchQuery(resourceType, query);
  return compilePlan(resourceType, request);
}

/**
 * Parse + plan + execute in one step: a FHIR search query string → matched
 * resources + total. Convenience for the HTTP layer.
 */
export function search(
  resourceType: ResourceType,
  query: string,
  repo: ResourceRepository,
): SearchResult {
  return executeSearch(compileSearch(resourceType, query), repo);
}
