import type { ResourceType } from '@/domain/fhir';

/**
 * FHIR search types — how a parameter value is interpreted and matched.
 * Reference: http://hl7.org/fhir/search.html#ptypes
 */
export type SearchParamType =
  | 'string' // partial/word matching, case-insensitive
  | 'token' // exact code/system match
  | 'reference' // literal "Type/id" or logical identifier
  | 'date' // date/dateTime with prefixes
  | 'number' // numeric with prefixes
  | 'quantity' // numeric+unit with prefixes
  | 'uri'; // exact URI match

/** Comparison prefixes for date / number / quantity params. */
export type Prefix = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'sa' | 'eb' | 'ap';

/** Modifiers we support. (`:in`, `:not-in`, `:above`/`:below` for token subsumption are stretch.) */
export type Modifier = 'exact' | 'contains' | 'missing' | 'not' | 'text';

/**
 * A FHIR search parameter definition: name → type + declarative extraction
 * paths. Paths are arrays of keys; the executor walks each path (handling
 * arrays) and matches if ANY path yields a candidate. Declarative (not a
 * function) so the plan is serializable and both in-memory and (later) SQLite
 * executors can lower it.
 *
 * Example: Patient `name` searches across family/given/text/prefix, so it has
 * multiple paths; `birthdate` has a single path.
 */
export interface ParamDefinition {
  readonly name: string;
  readonly type: SearchParamType;
  readonly paths: readonly (readonly string[])[];
  readonly description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsed (raw) request — type-agnostic output of the parser
// ─────────────────────────────────────────────────────────────────────────────

/** A raw parsed search parameter, before the planner resolves its type. */
export interface ParsedParam {
  /** Parameter name, e.g. 'name', 'birthdate', 'subject', '_id'. */
  readonly name: string;
  /** Modifier after ':', e.g. 'exact', 'missing'. */
  readonly modifier?: string;
  /** Type filter on a reference, e.g. 'Patient' in 'subject:Patient'. */
  readonly typeFilter?: string;
  /** Comma-separated OR values (already URL-decoded). */
  readonly values: readonly string[];
  /** Chained sub-params for reference chains, e.g. ['name'] for 'subject.name'. */
  readonly chain?: readonly string[];
}

/** Result operators parsed from `_sort` / `_count` / `_page` etc. */
export interface ResultOperators {
  readonly sort?: readonly SortKey[];
  readonly count?: number;
  readonly page?: number;
  readonly summary?: string;
  readonly total?: string;
}

export interface SortKey {
  readonly param: string;
  readonly descending: boolean;
}

export interface SearchRequest {
  readonly resourceType: ResourceType;
  /** Search params (implicitly AND across). */
  readonly params: readonly ParsedParam[];
  readonly result: ResultOperators;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compiled plan — what the executor (layer 4) evaluates
// ─────────────────────────────────────────────────────────────────────────────

export type PlanExpr =
  | { readonly op: 'and'; readonly exprs: readonly PlanExpr[] }
  | { readonly op: 'or'; readonly exprs: readonly PlanExpr[] }
  | { readonly op: 'leaf'; readonly leaf: LeafExpr };

/**
 * A resolved leaf predicate. `prefix` applies to date/number/quantity (eq for
 * the rest). `chain` carries reference-chain steps; execution is layer 4.
 */
export interface LeafExpr {
  readonly definition: ParamDefinition;
  readonly modifier?: Modifier;
  readonly typeFilter?: string;
  readonly prefix: Prefix;
  readonly values: readonly string[];
  readonly chain?: readonly ChainStep[];
}

export interface ChainStep {
  readonly name: string;
  readonly modifier?: string;
}

export interface SearchPlan {
  readonly resourceType: ResourceType;
  readonly filter: PlanExpr;
  readonly sort?: readonly SortKey[];
  readonly count?: number;
  readonly page?: number;
}

/** Names that are result operators, NOT search params (despite the `_` prefix). */
export const RESULT_PARAM_NAMES: Set<string> = new Set([
  '_sort',
  '_count',
  '_page',
  '_include',
  '_revinclude',
  '_summary',
  '_elements',
  '_total',
  '_format',
  '_contained',
]);
