import { describe, expect, it } from 'vitest';
import { BadRequestError } from '@/errors';
import { compileSearch } from './index';
import { getParamDefinition, paramNames } from './params';
import { parseSearchQuery } from './parser';
import { compilePlan } from './plan';
import type { LeafExpr, PlanExpr, SearchPlan } from './types';

// helper: unwrap a single-leaf filter (or the first child of an AND) to a leaf
function leafOf(expr: PlanExpr): LeafExpr {
  if (expr.op === 'leaf') return expr.leaf;
  if (expr.op === 'and') {
    const first = expr.exprs[0];
    if (first && first.op === 'leaf') return first.leaf;
  }
  throw new Error('expected a leaf (or and-with-leaf-first-child)');
}

describe('parser', () => {
  it('parses a simple param', () => {
    const r = parseSearchQuery('Patient', 'name=Smith');
    expect(r.params).toHaveLength(1);
    expect(r.params[0]?.name).toBe('name');
    expect(r.params[0]?.values).toEqual(['Smith']);
  });

  it('URL-decodes (+ and %XX)', () => {
    const r = parseSearchQuery('Patient', 'name=John+Doe&family=J%26D');
    expect(r.params[0]?.values).toEqual(['John Doe']);
    expect(r.params[1]?.values).toEqual(['J&D']);
  });

  it('splits comma values into an OR list', () => {
    const r = parseSearchQuery('Patient', 'gender=male,female');
    expect(r.params[0]?.values).toEqual(['male', 'female']);
  });

  it('captures a modifier and a chain', () => {
    const a = parseSearchQuery('Patient', 'name:exact=Smith');
    expect(a.params[0]?.modifier).toBe('exact');
    const b = parseSearchQuery('Observation', 'subject.name=Smith');
    expect(b.params[0]?.name).toBe('subject');
    expect(b.params[0]?.chain).toEqual(['name']);
  });

  it('classifies result operators separately', () => {
    const r = parseSearchQuery('Patient', '_sort=-birthdate&_count=20&_page=2');
    expect(r.params).toHaveLength(0);
    expect(r.result.sort).toEqual([{ param: 'birthdate', descending: true }]);
    expect(r.result.count).toBe(20);
    expect(r.result.page).toBe(2);
  });

  it('accepts _count=0 (FHIR: return no resources, report total)', () => {
    expect(parseSearchQuery('Patient', '_count=0').result.count).toBe(0);
  });

  it('rejects malformed _count with BadRequestError', () => {
    expect(() => parseSearchQuery('Patient', '_count=abc')).toThrow(BadRequestError);
    expect(() => parseSearchQuery('Patient', '_count=-1')).toThrow(BadRequestError);
  });

  it('rejects _page < 1 with BadRequestError', () => {
    expect(() => parseSearchQuery('Patient', '_page=0')).toThrow(BadRequestError);
    expect(() => parseSearchQuery('Patient', '_page=abc')).toThrow(BadRequestError);
  });

  it('treats repeated same-name params as separate raw params (planner ORs)', () => {
    const r = parseSearchQuery('Patient', 'name=A&name=B');
    expect(r.params).toHaveLength(2);
  });

  it('parses an empty query into an empty request', () => {
    const r = parseSearchQuery('Patient', '');
    expect(r.params).toHaveLength(0);
    expect(r.result.sort).toBeUndefined();
  });

  it('rejects malformed percent-encoding with BadRequestError', () => {
    expect(() => parseSearchQuery('Patient', 'name=%')).toThrow(BadRequestError);
  });

  it('accepts a leading "?"', () => {
    const r = parseSearchQuery('Patient', '?name=Smith');
    expect(r.params[0]?.values).toEqual(['Smith']);
  });
});

describe('parameter registry', () => {
  it('resolves known params with the right type', () => {
    expect(getParamDefinition('Patient', 'name')?.type).toBe('string');
    expect(getParamDefinition('Patient', 'birthdate')?.type).toBe('date');
    expect(getParamDefinition('Patient', 'gender')?.type).toBe('token');
    expect(getParamDefinition('Condition', 'patient')?.type).toBe('reference');
  });
  it('returns undefined for unknown params', () => {
    expect(getParamDefinition('Patient', 'nosuch')).toBeUndefined();
  });
  it('exposes a per-resource name list', () => {
    expect(paramNames('Patient')).toContain('name');
    expect(paramNames('Patient')).toContain('_id');
  });
});

describe('planner / compileSearch', () => {
  it('rejects an unknown search parameter', () => {
    expect(() => compileSearch('Patient', 'nosuch=1')).toThrow(BadRequestError);
  });

  it('rejects an unknown modifier on a string param', () => {
    expect(() => compileSearch('Patient', 'name:bogus=Smith')).toThrow(BadRequestError);
  });

  it('compiles a string param to an eq leaf', () => {
    const plan = compileSearch('Patient', 'name=Smith');
    const leaf = leafOf(plan.filter);
    expect(leaf.definition.type).toBe('string');
    expect(leaf.prefix).toBe('eq');
    expect(leaf.values).toEqual(['Smith']);
  });

  it('compiles a token param', () => {
    const leaf = leafOf(compileSearch('Patient', 'gender=female').filter);
    expect(leaf.definition.type).toBe('token');
    expect(leaf.values).toEqual(['female']);
  });

  it('compiles a reference param', () => {
    const leaf = leafOf(compileSearch('Condition', 'patient=Patient/1').filter);
    expect(leaf.definition.type).toBe('reference');
    expect(leaf.values).toEqual(['Patient/1']);
  });

  it('parses a date prefix', () => {
    const leaf = leafOf(compileSearch('Patient', 'birthdate=gt2000-01-01').filter);
    expect(leaf.prefix).toBe('gt');
    expect(leaf.values).toEqual(['2000-01-01']);
  });

  it('defaults date prefix to eq when absent', () => {
    const leaf = leafOf(compileSearch('Patient', 'birthdate=2000-01-01').filter);
    expect(leaf.prefix).toBe('eq');
  });

  it('ORs differing prefixes into an or-expression', () => {
    const plan = compileSearch('Patient', 'birthdate=gt2000-01-01,lt2010-01-01');
    expect(plan.filter.op).toBe('or');
    if (plan.filter.op === 'or') {
      expect(plan.filter.exprs).toHaveLength(2);
    }
  });

  it('keeps same-prefix multiple values in one leaf', () => {
    const leaf = leafOf(compileSearch('Patient', 'gender=male,female').filter);
    expect(leaf.values).toEqual(['male', 'female']);
  });

  it('ANDs across different params', () => {
    const plan = compileSearch('Patient', 'name=Smith&gender=female');
    expect(plan.filter.op).toBe('and');
    if (plan.filter.op === 'and') {
      expect(plan.filter.exprs).toHaveLength(2);
    }
  });

  it('honors modifiers (exact, missing)', () => {
    expect(leafOf(compileSearch('Patient', 'name:exact=Smith').filter).modifier).toBe('exact');
    expect(leafOf(compileSearch('Patient', 'name:missing=true').filter).modifier).toBe('missing');
  });

  it('treats an unknown :X on a reference as a type filter + chain', () => {
    const leaf = leafOf(compileSearch('Observation', 'subject:Patient.name=Smith').filter);
    expect(leaf.typeFilter).toBe('Patient');
    expect(leaf.chain?.[0]?.name).toBe('name');
  });

  it('passes sort/count/page through to the plan', () => {
    const plan: SearchPlan = compileSearch(
      'Patient',
      'name=Smith&_sort=-birthdate&_count=5&_page=3',
    );
    expect(plan.sort).toEqual([{ param: 'birthdate', descending: true }]);
    expect(plan.count).toBe(5);
    expect(plan.page).toBe(3);
  });

  it('empty query compiles to a match-all (empty and)', () => {
    const plan = compileSearch('Patient', '');
    expect(plan.filter).toEqual({ op: 'and', exprs: [] });
  });

  it('compilePlan and compileSearch agree', () => {
    const req = parseSearchQuery('Patient', 'name=Smith');
    const a = compilePlan('Patient', req);
    const b = compileSearch('Patient', 'name=Smith');
    expect(a.filter).toEqual(b.filter);
  });
});

describe('modifier ↔ type compatibility', () => {
  it(':exact and :contains are valid only on string params', () => {
    expect(leafOf(compileSearch('Patient', 'name:exact=Smith').filter).modifier).toBe('exact');
    expect(leafOf(compileSearch('Patient', 'name:contains=smi').filter).modifier).toBe('contains');
    // token param does not accept :exact
    expect(() => compileSearch('Patient', 'gender:exact=female')).toThrow(BadRequestError);
  });

  it(':not and :text are valid only on token params', () => {
    expect(leafOf(compileSearch('Patient', 'gender:not=female').filter).modifier).toBe('not');
    // string param does not accept :not
    expect(() => compileSearch('Patient', 'name:not=Smith')).toThrow(BadRequestError);
  });

  it(':missing is valid on every type', () => {
    expect(leafOf(compileSearch('Patient', 'name:missing=true').filter).modifier).toBe('missing');
    expect(leafOf(compileSearch('Patient', 'birthdate:missing=true').filter).modifier).toBe(
      'missing',
    );
    expect(leafOf(compileSearch('Patient', 'gender:missing=true').filter).modifier).toBe('missing');
  });

  it('date/quantity params reject value-modifiers (prefixes are used instead)', () => {
    expect(() => compileSearch('Patient', 'birthdate:text=2020')).toThrow(BadRequestError);
    expect(() => compileSearch('Patient', 'birthdate:exact=2020')).toThrow(BadRequestError);
  });

  it(':X on a reference is still treated as a type filter', () => {
    const leaf = leafOf(compileSearch('Observation', 'subject:Patient.name=Smith').filter);
    expect(leaf.typeFilter).toBe('Patient');
  });
});
