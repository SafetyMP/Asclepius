import type { ResourceType } from '@/domain/fhir';
import { BadRequestError } from '@/errors';
import { getParamDefinition } from './params';
import type {
  ChainStep,
  LeafExpr,
  Modifier,
  PlanExpr,
  Prefix,
  SearchParamType,
  SearchPlan,
  SearchRequest,
} from './types';

/**
 * Compile a parsed SearchRequest into a SearchPlan by resolving each raw param
 * against the parameter registry.
 *
 * Semantics (FHIR): different params AND; multiple values for one param OR
 * (whether comma-separated or repeated). For date/number/quantity, each value
 * may carry its own prefix; values with differing prefixes become an OR across
 * per-prefix leaves.
 *
 * Pure: takes a SearchRequest, returns serializable SearchPlan data. No storage.
 */

const KNOWN_PREFIXES: readonly Prefix[] = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'sa', 'eb', 'ap'];
const PREFIXABLE_TYPES = new Set(['date', 'number', 'quantity']);

/**
 * Per-type modifier validity (FHIR). `:missing` applies to every type and is
 * handled separately. `:exact`/`:contains` are string-only; `:not`/`:text` are
 * token-only. Date/number/quantity/uri accept no value-modifiers (they use
 * prefixes instead). On a reference param, any `:X` that isn't one of these is
 * a type filter (e.g. `subject:Patient`).
 */
const STRING_MODIFIERS = new Set<Modifier>(['exact', 'contains']);
const TOKEN_MODIFIERS = new Set<Modifier>(['not', 'text']);

interface ResolvedModifier {
  readonly modifier?: Modifier;
  readonly typeFilter?: string;
}

function resolveModifier(
  definitionType: SearchParamType,
  paramName: string,
  modifier: string | undefined,
): ResolvedModifier {
  if (!modifier) return {};
  // :missing is valid on every parameter type.
  if (modifier === 'missing') return { modifier: 'missing' };
  // On a reference, any other `:X` is a type filter (e.g. `subject:Patient`).
  if (definitionType === 'reference') return { typeFilter: modifier };
  if (definitionType === 'string' && STRING_MODIFIERS.has(modifier as Modifier)) {
    return { modifier: modifier as Modifier };
  }
  if (definitionType === 'token' && TOKEN_MODIFIERS.has(modifier as Modifier)) {
    return { modifier: modifier as Modifier };
  }
  // date/number/quantity/uri accept only :missing; anything else (incl. stretch
  // subsumption `:above`/`:below`) is rejected with a clear 400.
  throw new BadRequestError(
    `modifier ':${modifier}' is not valid for ${definitionType} parameter '${paramName}'`,
  );
}

function splitPrefix(value: string, definitionType: string): { prefix: Prefix; value: string } {
  if (PREFIXABLE_TYPES.has(definitionType) && value.length > 2) {
    const head = value.slice(0, 2);
    if ((KNOWN_PREFIXES as readonly string[]).includes(head)) {
      return { prefix: head as Prefix, value: value.slice(2) };
    }
  }
  return { prefix: 'eq', value };
}

interface ResolvedGroup {
  readonly name: string;
  readonly definitionType: string;
  readonly modifier?: Modifier;
  readonly typeFilter?: string;
  readonly chain?: readonly ChainStep[];
  readonly values: readonly string[];
}

export function compilePlan(resourceType: ResourceType, request: SearchRequest): SearchPlan {
  // Group raw params by (name + modifier + typeFilter + chain) → OR their values.
  const groups = new Map<string, ResolvedGroup>();
  for (const p of request.params) {
    const def = getParamDefinition(resourceType, p.name);
    if (!def) {
      throw new BadRequestError(`unknown search parameter '${p.name}' for ${resourceType}`);
    }
    const { modifier, typeFilter } = resolveModifier(def.type, def.name, p.modifier);
    const chain: ChainStep[] | undefined = p.chain?.map((name) => ({ name }));
    const key = `${p.name}|${modifier ?? ''}|${typeFilter ?? ''}|${chain?.map((c) => c.name).join('.') ?? ''}`;

    const existing = groups.get(key);
    if (existing) {
      groups.set(key, {
        ...existing,
        values: [...existing.values, ...p.values],
      });
    } else {
      groups.set(key, {
        name: p.name,
        definitionType: def.type,
        ...(modifier ? { modifier } : {}),
        ...(typeFilter ? { typeFilter } : {}),
        ...(chain ? { chain } : {}),
        values: p.values,
      });
    }
  }

  // Build one OR-expression per group (per-prefix leaves), AND across groups.
  const groupExprs: PlanExpr[] = [];
  for (const g of groups.values()) {
    const def = getParamDefinition(resourceType, g.name);
    if (!def) continue; // invariant — already validated above

    // Bucket values by prefix (all values share eq for non-prefixable types).
    const byPrefix = new Map<Prefix, string[]>();
    for (const v of g.values) {
      const { prefix, value } = splitPrefix(v, g.definitionType);
      const bucket = byPrefix.get(prefix);
      if (bucket) bucket.push(value);
      else byPrefix.set(prefix, [value]);
    }

    const leaves: LeafExpr[] = [...byPrefix.entries()].map(([prefix, values]) => ({
      definition: def,
      prefix,
      values,
      ...(g.modifier ? { modifier: g.modifier } : {}),
      ...(g.typeFilter ? { typeFilter: g.typeFilter } : {}),
      ...(g.chain ? { chain: g.chain } : {}),
    }));

    if (leaves.length === 1) {
      groupExprs.push({ op: 'leaf', leaf: leaves[0] as LeafExpr });
    } else {
      groupExprs.push({
        op: 'or',
        exprs: leaves.map((l) => ({ op: 'leaf', leaf: l })),
      });
    }
  }

  const filter: PlanExpr =
    groupExprs.length === 0
      ? { op: 'and', exprs: [] } // empty AND = match all
      : groupExprs.length === 1
        ? (groupExprs[0] as PlanExpr)
        : { op: 'and', exprs: groupExprs };

  return {
    resourceType,
    filter,
    ...(request.result.sort ? { sort: request.result.sort } : {}),
    ...(request.result.count !== undefined ? { count: request.result.count } : {}),
    ...(request.result.page !== undefined ? { page: request.result.page } : {}),
  };
}
