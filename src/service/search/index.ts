import type { ResourceType } from '@/domain/fhir';
import { parseSearchQuery } from './parser';
import { compilePlan } from './plan';
import type { SearchPlan, SearchRequest } from './types';

export { getParamDefinition, paramNames } from './params';
export { parseSearchQuery } from './parser';
export { compilePlan } from './plan';
export * from './types';

/**
 * Parse + plan in one step: a FHIR search query string → executable SearchPlan.
 * Throws BadRequestError (→ 422/400 OperationOutcome) on unknown params or
 * modifiers. Execution is layer 4.
 */
export function compileSearch(resourceType: ResourceType, query: string): SearchPlan {
  const request: SearchRequest = parseSearchQuery(resourceType, query);
  return compilePlan(resourceType, request);
}
