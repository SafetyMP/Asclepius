import type { ResourceType } from '@/domain/fhir';
import { BadRequestError } from '@/errors';
import type { ParsedParam, ResultOperators, SearchRequest, SortKey } from './types';
import { RESULT_PARAM_NAMES } from './types';

/**
 * Parse a FHIR search query string into a type-agnostic SearchRequest.
 *
 * Pure: no knowledge of parameter types or definitions (that's the planner's
 * job). Responsibilities: URL-decode, split into params, separate result
 * operators (`_sort`/`_count`/…) from search params, capture `:` modifiers,
 * `.` chains, and comma-separated OR values.
 *
 * One ParsedParam per `&` segment. The planner later groups same-name params
 * into an OR (whether they arrived as `name=A,B` or `name=A&name=B`).
 */

/** URL-decode a query component (`+` → space, then %XX). */
function decode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    // malformed %XX — surface as a 400 rather than crashing
    throw new BadRequestError(`malformed URL-encoded query component: ${s}`);
  }
}

interface ParsedKey {
  name: string;
  modifier?: string;
  chain?: string[];
}

function parseKey(rawKey: string): ParsedKey {
  const decoded = decode(rawKey);
  const parts = decoded.split('.');
  const head = parts[0] ?? '';
  const chain = parts.slice(1);
  const colonParts = head.split(':');
  const name = colonParts[0] ?? '';
  const modifier = colonParts[1];
  return {
    name,
    ...(modifier ? { modifier } : {}),
    ...(chain.length > 0 ? { chain } : {}),
  };
}

function parseSort(value: string): SortKey[] {
  return value.split(',').map((token) => {
    const trimmed = token.trim();
    if (!trimmed) return { param: '', descending: false };
    const descending = trimmed.startsWith('-');
    return { param: descending ? trimmed.slice(1) : trimmed, descending };
  });
}

/**
 * Parse a result-operator integer (`_count` / `_page`) strictly. FHIR requires
 * these to be integers; malformed values are a 400 BadRequest (surfaced as an
 * OperationOutcome at the boundary), not silently dropped. `_count` may be 0
 * (FHIR: return no resources but report total); `_page` is 1-based.
 */
function parseResultInt(value: string, name: string, min: number): number {
  if (!/^\d+$/.test(value.trim())) {
    throw new BadRequestError(`${name} must be an integer, got: ${value}`);
  }
  const n = Number.parseInt(value, 10);
  if (n < min) {
    throw new BadRequestError(`${name} must be >= ${min}, got: ${value}`);
  }
  return n;
}

/** Parse the query portion (with or without a leading `?`). */
export function parseSearchQuery(resourceType: ResourceType, query: string): SearchRequest {
  const q = query.startsWith('?') ? query.slice(1) : query;
  const params: ParsedParam[] = [];
  let result: ResultOperators = {};

  if (q.length > 0) {
    for (const segment of q.split('&')) {
      if (!segment) continue;
      const eq = segment.indexOf('=');
      const rawKey = eq === -1 ? segment : segment.slice(0, eq);
      const rawValue = eq === -1 ? '' : segment.slice(eq + 1);

      const { name, modifier, chain } = parseKey(rawKey);
      const values = rawValue.length > 0 ? rawValue.split(',').map(decode) : [''];

      if (RESULT_PARAM_NAMES.has(name)) {
        result = mergeResult(result, name, rawValue);
        continue;
      }
      params.push({
        name,
        values,
        ...(modifier ? { modifier } : {}),
        ...(chain ? { chain } : {}),
      });
    }
  }

  return { resourceType, params, result };
}

function mergeResult(prev: ResultOperators, name: string, rawValue: string): ResultOperators {
  const value = decode(rawValue);
  switch (name) {
    case '_sort':
      return { ...prev, sort: parseSort(value) };
    case '_count':
      return { ...prev, count: parseResultInt(value, '_count', 0) };
    case '_page':
      return { ...prev, page: parseResultInt(value, '_page', 1) };
    case '_summary':
      return { ...prev, summary: value };
    case '_total':
      return { ...prev, total: value };
    default:
      // other result params (_include/_revinclude/_elements/…) acknowledged but
      // not yet executed — preserved as no-ops for forward compatibility.
      return prev;
  }
}
