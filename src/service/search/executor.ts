import type { ResourceType } from '@/domain/fhir';
import type { ResourceRepository, StoredResource } from '@/port/repository';
import type { SearchResult } from '@/port/search';
import { compareDate, dateInterval, type Interval } from './date';
import { getParamDefinition } from './params';
import type { LeafExpr, PlanExpr, Prefix, SearchPlan } from './types';

// Re-export so existing `import { SearchResult } from '@/service/search'` keeps
// working; the canonical definition lives in the port.
export type { SearchResult };

/**
 * The FHIR search executor (layer 4).
 *
 * First principles: the planner (layer 3) produces a serializable `SearchPlan`.
 * This module evaluates that plan against a `ResourceRepository` port — it calls
 * `repo.list(resourceType)` and applies the filter tree, then sort and
 * pagination. It is pure application logic over the port: no adapter imports,
 * no storage coupling. Any `ResourceRepository` (in-memory now, SQLite later)
 * satisfies it.
 *
 * Reference semantics: http://hl7.org/fhir/search.html
 *
 * Public API: `executeSearch`. The per-type `matchLeaf` and helpers are exported
 * only so the co-located test can exercise every type (incl. number/quantity,
 * which the registry does not yet define a param for) directly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Result type
// ─────────────────────────────────────────────────────────────────────────────

// SearchResult is defined in `@/port/search` (the port the HTTP adapter depends
// on). See the re-export above.

// ─────────────────────────────────────────────────────────────────────────────
// Path extraction — walk declarative param paths through a resource, flattening
// arrays. A param matches if ANY of its paths yields a matching candidate.
// ─────────────────────────────────────────────────────────────────────────────

/** Walk `path` through `obj`, descending into arrays at every step. */
export function extractValues(obj: unknown, path: readonly string[]): unknown[] {
  let current: unknown[] = [obj];
  for (const key of path) {
    const next: unknown[] = [];
    for (const node of current) {
      if (node !== null && typeof node === 'object' && key in (node as object)) {
        const val = (node as Record<string, unknown>)[key];
        if (Array.isArray(val)) next.push(...val);
        else next.push(val);
      }
    }
    current = next;
  }
  return current;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isPresent = (v: unknown): boolean => v !== undefined && v !== null;

/** Split on the first occurrence of `sep`; the remainder keeps later seps. */
function splitOnce(s: string, sep: string): [string, string] {
  const i = s.indexOf(sep);
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + sep.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-type matchers. Each returns true if ANY candidate matches ANY of the
// leaf's OR-values (with the leaf's prefix/modifier applied).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * string — default is case-insensitive, word-prefix matching (the common FHIR
 * string search: the field value starts with the supplied value).
 * - `:exact` → case-sensitive equality.
 * - `:contains` → case-insensitive substring anywhere.
 */
function matchString(leaf: LeafExpr, candidates: unknown[]): boolean {
  const strs = candidates.filter(isString);
  const test = (candidate: string, value: string): boolean => {
    switch (leaf.modifier) {
      case 'exact':
        return candidate === value;
      case 'contains':
        return candidate.toLowerCase().includes(value.toLowerCase());
      default:
        return candidate.toLowerCase().startsWith(value.toLowerCase());
    }
  };
  return strs.some((c) => leaf.values.some((v) => test(c, v)));
}

/**
 * token — exact code match (case-sensitive, per FHIR). Supports the
 * `system|code` / `system|` / `|code` forms by independent presence of the
 * system and code among the candidates (a documented approximation: the
 * declarative path registry does not encode system↔code pairing, so a
 * production index would be needed for fully-paired matching).
 * - `:not` → negation of the default match.
 * - `:text` → case-insensitive substring against display/text candidates.
 */
function matchToken(leaf: LeafExpr, candidates: unknown[]): boolean {
  const strs = candidates.filter(isString);
  if (leaf.modifier === 'text') {
    const lower = strs.map((s) => s.toLowerCase());
    return leaf.values.some((v) => lower.some((c) => c.includes(v.toLowerCase())));
  }
  const matchesValue = (value: string): boolean => {
    if (value.includes('|')) {
      const [system, code] = splitOnce(value, '|');
      if (code !== '' && !strs.includes(code)) return false;
      if (system !== '' && !strs.includes(system)) return false;
      return true;
    }
    return strs.includes(value);
  };
  const result = leaf.values.some(matchesValue);
  return leaf.modifier === 'not' ? !result : result;
}

/** uri — exact match. */
function matchUri(leaf: LeafExpr, candidates: unknown[]): boolean {
  const strs = candidates.filter(isString);
  return leaf.values.some((v) => strs.includes(v));
}

/** date — precision-aware interval comparison (see date.ts). */
function matchDate(leaf: LeafExpr, candidates: unknown[]): boolean {
  const searchIntervals: Interval[] = [];
  for (const v of leaf.values) {
    const iv = dateInterval(v);
    if (iv) searchIntervals.push(iv);
  }
  if (searchIntervals.length === 0) return false;
  return candidates.some((c) => {
    if (typeof c !== 'string') return false;
    const ri = dateInterval(c);
    return ri !== undefined && searchIntervals.some((si) => compareDate(si, ri, leaf.prefix));
  });
}

function compareNumber(candidate: number, value: number, prefix: Prefix): boolean {
  switch (prefix) {
    case 'eq':
      return candidate === value;
    case 'ne':
      return candidate !== value;
    case 'gt':
    case 'sa':
      return candidate > value;
    case 'ge':
      return candidate >= value;
    case 'lt':
    case 'eb':
      return candidate < value;
    case 'le':
      return candidate <= value;
    case 'ap':
      return candidate === value;
    default:
      return false;
  }
}

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** number — numeric prefix comparison. */
function matchNumber(leaf: LeafExpr, candidates: unknown[]): boolean {
  return candidates.some((c) => {
    const cn = toNumber(c);
    if (cn === undefined) return false;
    return leaf.values.some((v) => {
      const vn = toNumber(v);
      return vn !== undefined && compareNumber(cn, vn, leaf.prefix);
    });
  });
}

/**
 * quantity — numeric prefix comparison with an optional unit. The value form is
 * `value`, `value|unit`, or `value|system|code`; the unit (last segment) is
 * matched against the candidate Quantity's `unit` or `code`. (No registry param
 * uses quantity today; provided for forward-completeness.)
 */
function matchQuantity(leaf: LeafExpr, candidates: unknown[]): boolean {
  return candidates.some((c) => {
    if (c === null || typeof c !== 'object') return false;
    const q = c as { value?: unknown; unit?: unknown; code?: unknown };
    const cn = toNumber(q.value);
    if (cn === undefined) return false;
    const candUnit = typeof q.unit === 'string' ? q.unit : q.code;
    return leaf.values.some((v) => {
      const parts = v.split('|');
      const vn = toNumber(parts[0]);
      if (vn === undefined || !compareNumber(cn, vn, leaf.prefix)) return false;
      const wantUnit = parts.length >= 2 ? parts[parts.length - 1] : undefined;
      if (wantUnit !== undefined && wantUnit !== '') {
        return typeof candUnit === 'string' && candUnit === wantUnit;
      }
      return true;
    });
  });
}

/** reference — literal "Type/id" or bare "id", with an optional `:Type` filter. */
function matchReference(leaf: LeafExpr, candidates: unknown[]): boolean {
  const refs = candidates.filter(isString);
  return leaf.values.some((value) => refs.some((ref) => refMatches(ref, value, leaf.typeFilter)));
}

function refMatches(ref: string, value: string, typeFilter: string | undefined): boolean {
  if (value.includes('/')) {
    if (typeFilter !== undefined && !value.startsWith(`${typeFilter}/`)) return false;
    return ref === value;
  }
  // bare id: match a reference whose id part equals value
  const slash = ref.indexOf('/');
  const refType = slash >= 0 ? ref.slice(0, slash) : undefined;
  const refId = slash >= 0 ? ref.slice(slash + 1) : ref;
  if (refId !== value) return false;
  if (typeFilter !== undefined && refType !== typeFilter) return false;
  return true;
}

/** Dispatch a leaf's match against already-extracted candidate values. */
export function matchLeaf(leaf: LeafExpr, candidates: unknown[]): boolean {
  switch (leaf.definition.type) {
    case 'string':
      return matchString(leaf, candidates);
    case 'token':
      return matchToken(leaf, candidates);
    case 'reference':
      return matchReference(leaf, candidates);
    case 'date':
      return matchDate(leaf, candidates);
    case 'number':
      return matchNumber(leaf, candidates);
    case 'quantity':
      return matchQuantity(leaf, candidates);
    case 'uri':
      return matchUri(leaf, candidates);
    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter-tree evaluation
// ─────────────────────────────────────────────────────────────────────────────

function evalExpr(expr: PlanExpr, resource: StoredResource, repo: ResourceRepository): boolean {
  switch (expr.op) {
    case 'and':
      // empty AND = match all (every() on [] is true)
      return expr.exprs.every((e) => evalExpr(e, resource, repo));
    case 'or':
      return expr.exprs.some((e) => evalExpr(e, resource, repo));
    case 'leaf':
      return evalLeaf(expr.leaf, resource, repo);
  }
}

function evalLeaf(leaf: LeafExpr, resource: StoredResource, repo: ResourceRepository): boolean {
  if (leaf.modifier === 'missing') {
    const present = leaf.definition.paths.some((p) => extractValues(resource, p).some(isPresent));
    const wantMissing = (leaf.values[0] ?? 'true') !== 'false';
    return wantMissing ? !present : present;
  }
  if (leaf.chain && leaf.chain.length > 0) {
    return evalChain(leaf, resource, repo);
  }
  const candidates = leaf.definition.paths.flatMap((p) => extractValues(resource, p));
  return matchLeaf(leaf, candidates);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reference chaining — `subject.name=Smith` resolves the reference via the
// repository, then evaluates the chained param against the target resource.
// Multi-step chains recurse.
// ─────────────────────────────────────────────────────────────────────────────

interface ResolvedRef {
  readonly type: string;
  readonly id: string;
}

/** Parse a literal "Type/id" reference. Returns undefined for urn/http/bare ids. */
function parseReference(ref: string): ResolvedRef | undefined {
  const slash = ref.indexOf('/');
  if (slash <= 0) return undefined;
  const type = ref.slice(0, slash);
  const id = ref.slice(slash + 1);
  if (!id) return undefined;
  // Logical references (urn:uuid:, http/https) are not resolved by the repo.
  if (type === 'urn' || type === 'http' || type === 'https') return undefined;
  return { type, id };
}

function resolveTarget(
  repo: ResourceRepository,
  type: string,
  id: string,
): StoredResource | undefined {
  try {
    // Justified cast: repo.read is keyed by ResourceType, but an unsupported
    // type simply yields no entry (NotFoundError) — caught here → not a match.
    return repo.read(type as ResourceType, id);
  } catch {
    return undefined;
  }
}

function evalChain(leaf: LeafExpr, resource: StoredResource, repo: ResourceRepository): boolean {
  const refs = leaf.definition.paths.flatMap((p) => extractValues(resource, p)).filter(isString);
  const chain = leaf.chain ?? [];
  return refs.some((ref) => {
    const parsed = parseReference(ref);
    if (!parsed) return false;
    if (leaf.typeFilter !== undefined && parsed.type !== leaf.typeFilter) return false;
    const target = resolveTarget(repo, parsed.type, parsed.id);
    if (!target) return false;
    return evalChainAt(chain, 0, parsed.type as ResourceType, target, leaf, repo);
  });
}

function evalChainAt(
  chain: readonly { readonly name: string }[],
  index: number,
  currentType: ResourceType,
  currentResource: StoredResource,
  leaf: LeafExpr,
  repo: ResourceRepository,
): boolean {
  const step = chain[index];
  if (!step) return false;
  const def = getParamDefinition(currentType, step.name);
  if (!def) return false; // unknown chained param → no match

  if (index === chain.length - 1) {
    // terminal step: evaluate the predicate against the target resource
    const candidates = def.paths.flatMap((p) => extractValues(currentResource, p));
    const subLeaf: LeafExpr = {
      definition: def,
      prefix: leaf.prefix,
      values: leaf.values,
      ...(leaf.modifier ? { modifier: leaf.modifier } : {}),
    };
    return matchLeaf(subLeaf, candidates);
  }

  // intermediate step: must be a reference; resolve and recurse
  if (def.type !== 'reference') return false;
  const refs = def.paths.flatMap((p) => extractValues(currentResource, p)).filter(isString);
  return refs.some((ref) => {
    const parsed = parseReference(ref);
    if (!parsed) return false;
    const target = resolveTarget(repo, parsed.type, parsed.id);
    return target !== undefined
      ? evalChainAt(chain, index + 1, parsed.type as ResourceType, target, leaf, repo)
      : false;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Result operators — _sort and _count/_page
// ─────────────────────────────────────────────────────────────────────────────

/** Extract a comparable sort value (number for date/number, else lowercased string). */
function sortValue(
  resource: StoredResource,
  def: ReturnType<typeof getParamDefinition>,
): number | string | undefined {
  if (!def) return undefined;
  const candidates = def.paths.flatMap((p) => extractValues(resource, p)).filter(isPresent);
  const first = candidates[0];
  if (first === undefined) return undefined;
  if (def.type === 'date') {
    const iv = typeof first === 'string' ? dateInterval(first) : undefined;
    return iv?.lower;
  }
  if (def.type === 'number' || def.type === 'quantity') {
    return toNumber(first);
  }
  return typeof first === 'string' ? first.toLowerCase() : String(first).toLowerCase();
}

function applySort(
  resources: readonly StoredResource[],
  sortKeys: readonly { readonly param: string; readonly descending: boolean }[],
): StoredResource[] {
  return [...resources].sort((a, b) => {
    for (const key of sortKeys) {
      const def = getParamDefinition(a.resourceType, key.param);
      const av = sortValue(a, def);
      const bv = sortValue(b, def);
      let cmp = 0;
      if (av === undefined && bv === undefined) cmp = 0;
      else if (av === undefined)
        cmp = 1; // missing sorts last (ascending)
      else if (bv === undefined) cmp = -1;
      else cmp = av < bv ? -1 : av > bv ? 1 : 0;
      if (cmp !== 0) return key.descending ? -cmp : cmp;
    }
    // stable, deterministic tiebreak by id so pagination is reproducible
    return (a.id ?? '').localeCompare(b.id ?? '');
  });
}

function applyPagination(
  resources: readonly StoredResource[],
  count: number | undefined,
  page: number | undefined,
): StoredResource[] {
  if (count === undefined) return [...resources];
  if (count === 0) return []; // FHIR: return no resources, but total is still reported
  const p = page ?? 1;
  const start = (p - 1) * count;
  if (start < 0) return [...resources];
  return resources.slice(start, start + count);
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a compiled `SearchPlan` against a repository. Returns the matched
 * (sorted + paginated) resources and the total match count (before pagination,
 * for `Bundle.total`).
 */
export function executeSearch(plan: SearchPlan, repo: ResourceRepository): SearchResult {
  const all = repo.list(plan.resourceType);
  const matched = all.filter((r) => evalExpr(plan.filter, r, repo));
  const total = matched.length;
  const sorted = plan.sort ? applySort(matched, plan.sort) : matched;
  const resources = applyPagination(sorted, plan.count, plan.page);
  return { resources, total };
}
