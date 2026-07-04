import { describe, expect, it } from 'vitest';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import type { FhirResource } from '@/domain/fhir';
import { compareDate, dateInterval, type Interval } from './date';
import { executeSearch as execFromExecutor, extractValues, matchLeaf } from './executor';
import { compileSearch, executeSearch, search } from './index';
import type { LeafExpr, Modifier, ParamDefinition, Prefix } from './types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeLeaf(
  def: ParamDefinition,
  values: string[],
  opts: { modifier?: Modifier; prefix?: Prefix } = {},
): LeafExpr {
  return {
    definition: def,
    prefix: opts.prefix ?? 'eq',
    values,
    ...(opts.modifier ? { modifier: opts.modifier } : {}),
  };
}

const ms = (iso: string): number => Date.parse(iso);

/** Minimal defs for unit-testing matchers directly (incl. unregistered types). */
const defs = {
  string: { name: 'x', type: 'string', paths: [['family']] } as const,
  token: { name: 'x', type: 'token', paths: [['code']] } as const,
  reference: { name: 'x', type: 'reference', paths: [['ref']] } as const,
  date: { name: 'x', type: 'date', paths: [['when']] } as const,
  number: { name: 'x', type: 'number', paths: [['value']] } as const,
  quantity: {
    name: 'x',
    type: 'quantity',
    paths: [['valueQuantity']],
  } as const,
  uri: { name: 'x', type: 'uri', paths: [['url']] } as const,
};

/** Seed an in-memory repo with a small, varied dataset for integration tests. */
function seedRepo(): InMemoryResourceRepository {
  const repo = new InMemoryResourceRepository();
  repo.create({
    resourceType: 'Patient',
    id: 'p1',
    name: [{ family: 'Smith', given: ['John'] }],
    gender: 'male',
    birthDate: '1990-05-20',
    active: true,
  } as FhirResource);
  repo.create({
    resourceType: 'Patient',
    id: 'p2',
    name: [{ family: 'Jones', given: ['Mary'] }],
    gender: 'female',
    birthDate: '2000-11-03',
  } as FhirResource);
  repo.create({
    resourceType: 'Patient',
    id: 'p3',
    name: [{ family: 'Smythe' }],
    birthDate: '1985-01-01',
  } as FhirResource);
  repo.create({
    resourceType: 'Observation',
    id: 'o1',
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '2951-2' }],
      text: 'Sodium',
    },
    subject: { reference: 'Patient/p1' },
  } as FhirResource);
  repo.create({
    resourceType: 'Observation',
    id: 'o2',
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code: '2951-2' }] },
    subject: { reference: 'Patient/p2' },
  } as FhirResource);
  return repo;
}

// ─── date intervals (unit) ────────────────────────────────────────────────────

describe('dateInterval — partial-date bounds', () => {
  it('year precision covers the whole year', () => {
    const iv = dateInterval('2020');
    expect(iv?.lower).toBe(ms('2020-01-01T00:00:00.000Z'));
    expect(iv?.upper).toBe(ms('2020-12-31T23:59:59.999Z'));
  });
  it('month precision covers the whole month (leap-year aware)', () => {
    expect(dateInterval('2020-02')?.upper).toBe(ms('2020-02-29T23:59:59.999Z'));
    expect(dateInterval('2021-02')?.upper).toBe(ms('2021-02-28T23:59:59.999Z'));
  });
  it('day precision covers the whole day', () => {
    const iv = dateInterval('2020-06-15');
    expect(iv?.lower).toBe(ms('2020-06-15T00:00:00.000Z'));
    expect(iv?.upper).toBe(ms('2020-06-15T23:59:59.999Z'));
  });
  it('a dateTime/instant is a point interval', () => {
    const iv = dateInterval('2020-06-15T10:30:00Z');
    expect(iv?.lower).toBe(ms('2020-06-15T10:30:00Z'));
    expect(iv?.lower).toBe(iv?.upper);
  });
  it('a naive dateTime is treated as UTC for determinism', () => {
    expect(dateInterval('2020-06-15T10:30:00')?.lower).toBe(ms('2020-06-15T10:30:00Z'));
  });
  it('returns undefined for an unparseable value', () => {
    expect(dateInterval('not-a-date')).toBeUndefined();
  });
});

describe('compareDate — prefix semantics', () => {
  const D = (v: string): Interval => {
    const iv = dateInterval(v);
    if (!iv) throw new Error(`unexpectedly unparseable date in test: ${v}`);
    return iv;
  };
  it('eq overlaps; ne does not', () => {
    expect(compareDate(D('2020'), D('2020-06-15'), 'eq')).toBe(true);
    expect(compareDate(D('2020'), D('2019-12-31'), 'eq')).toBe(false);
    expect(compareDate(D('2020'), D('2019-12-31'), 'ne')).toBe(true);
  });
  it('gt/lt compare against the period bounds', () => {
    expect(compareDate(D('2020-01-01'), D('2020-06-15'), 'gt')).toBe(true);
    expect(compareDate(D('2020-01-01'), D('2019-06-15'), 'gt')).toBe(false);
    expect(compareDate(D('2020-01-01'), D('1985-01-01'), 'lt')).toBe(true);
  });
  it('sa (starts-after) and eb (ends-before) are strict', () => {
    expect(compareDate(D('2020'), D('2021-01-01'), 'sa')).toBe(true);
    expect(compareDate(D('2020'), D('2020-12-31'), 'sa')).toBe(false);
    expect(compareDate(D('2020'), D('2019-12-31'), 'eb')).toBe(true);
  });
});

// ─── path extraction (unit) ───────────────────────────────────────────────────

describe('extractValues — path traversal through arrays', () => {
  it('flattens arrays at every step', () => {
    expect(
      extractValues({ name: [{ family: 'Smith', given: ['John', 'Q'] }] }, ['name', 'given']),
    ).toEqual(['John', 'Q']);
  });
  it('collects across array elements', () => {
    expect(
      extractValues({ identifier: [{ value: 'abc' }, { value: 'def' }] }, ['identifier', 'value']),
    ).toEqual(['abc', 'def']);
  });
  it('yields [] when the path is absent', () => {
    expect(extractValues({ a: 1 }, ['name', 'family'])).toEqual([]);
  });
});

// ─── matchers (unit, per type) ────────────────────────────────────────────────

describe('matchLeaf — string', () => {
  it('default is case-insensitive prefix', () => {
    expect(matchLeaf(makeLeaf(defs.string, ['smi']), ['Smith', 'Jones'])).toBe(true);
    expect(matchLeaf(makeLeaf(defs.string, ['smith']), ['Jones'])).toBe(false);
  });
  it(':exact is case-sensitive equality', () => {
    expect(matchLeaf(makeLeaf(defs.string, ['Smith'], { modifier: 'exact' }), ['Smith'])).toBe(
      true,
    );
    expect(matchLeaf(makeLeaf(defs.string, ['smith'], { modifier: 'exact' }), ['Smith'])).toBe(
      false,
    );
  });
  it(':contains is case-insensitive substring', () => {
    expect(matchLeaf(makeLeaf(defs.string, ['MIT'], { modifier: 'contains' }), ['Smith'])).toBe(
      true,
    );
  });
});

describe('matchLeaf — token', () => {
  it('exact code match', () => {
    expect(matchLeaf(makeLeaf(defs.token, ['active']), ['active', 'cancelled'])).toBe(true);
    expect(matchLeaf(makeLeaf(defs.token, ['active']), ['cancelled'])).toBe(false);
  });
  it(':not negates', () => {
    expect(matchLeaf(makeLeaf(defs.token, ['active'], { modifier: 'not' }), ['cancelled'])).toBe(
      true,
    );
  });
  it(':text is case-insensitive substring', () => {
    expect(matchLeaf(makeLeaf(defs.token, ['hyper'], { modifier: 'text' }), ['Hypertension'])).toBe(
      true,
    );
  });
  it('system|code form (best-effort presence)', () => {
    expect(
      matchLeaf(makeLeaf(defs.token, ['http://loinc.org|2951-2']), ['2951-2', 'http://loinc.org']),
    ).toBe(true);
    expect(matchLeaf(makeLeaf(defs.token, ['|2951-2']), ['2951-2'])).toBe(true);
  });
});

describe('matchLeaf — date / number / quantity / uri / reference', () => {
  it('date prefix comparison', () => {
    expect(matchLeaf(makeLeaf(defs.date, ['1990'], { prefix: 'eq' }), ['1990-05-20'])).toBe(true);
    expect(matchLeaf(makeLeaf(defs.date, ['1990-01-01'], { prefix: 'gt' }), ['2000-11-03'])).toBe(
      true,
    );
    expect(matchLeaf(makeLeaf(defs.date, ['1990-01-01'], { prefix: 'gt' }), ['1985-01-01'])).toBe(
      false,
    );
  });
  it('number prefixes', () => {
    expect(matchLeaf(makeLeaf(defs.number, ['140']), [140])).toBe(true);
    expect(matchLeaf(makeLeaf(defs.number, ['100'], { prefix: 'gt' }), [140])).toBe(true);
    expect(matchLeaf(makeLeaf(defs.number, ['200'], { prefix: 'gt' }), [140])).toBe(false);
  });
  it('quantity numeric + optional unit', () => {
    expect(matchLeaf(makeLeaf(defs.quantity, ['140']), [{ value: 140, unit: 'mmol/L' }])).toBe(
      true,
    );
    expect(
      matchLeaf(makeLeaf(defs.quantity, ['140|mmol/L']), [{ value: 140, unit: 'mmol/L' }]),
    ).toBe(true);
    expect(matchLeaf(makeLeaf(defs.quantity, ['140|mg']), [{ value: 140, unit: 'mmol/L' }])).toBe(
      false,
    );
  });
  it('uri exact match', () => {
    expect(matchLeaf(makeLeaf(defs.uri, ['http://example.com/x']), ['http://example.com/x'])).toBe(
      true,
    );
    expect(matchLeaf(makeLeaf(defs.uri, ['http://example.com/x']), ['other'])).toBe(false);
  });
  it('reference literal and bare-id matching', () => {
    expect(matchLeaf(makeLeaf(defs.reference, ['Patient/p1']), ['Patient/p1'])).toBe(true);
    expect(matchLeaf(makeLeaf(defs.reference, ['p1']), ['Patient/p1'])).toBe(true);
    expect(matchLeaf(makeLeaf(defs.reference, ['p1']), ['Observation/o1'])).toBe(false);
  });
});

// ─── executeSearch — end-to-end (integration vs in-memory repo) ───────────────

describe('executeSearch — integration', () => {
  it('re-exports are the same function', () => {
    expect(execFromExecutor).toBe(executeSearch);
  });

  it('empty query matches all of a type', () => {
    const r = executeSearch(compileSearch('Patient', ''), seedRepo());
    expect(r.total).toBe(3);
    expect(r.resources).toHaveLength(3);
  });

  it('string search (default prefix)', () => {
    // 'smith' prefix matches 'Smith' but not 'Smythe' (3rd char differs)
    const r = executeSearch(compileSearch('Patient', 'name=smith'), seedRepo());
    expect(r.resources.map((x) => x.id)).toEqual(['p1']);
    // 'sm' prefix matches both Smith and Smythe
    const r2 = executeSearch(compileSearch('Patient', 'name=sm'), seedRepo());
    expect(r2.resources.map((x) => x.id).sort()).toEqual(['p1', 'p3']);
  });

  it('string :exact', () => {
    const r = executeSearch(compileSearch('Patient', 'name:exact=Smith'), seedRepo());
    expect(r.resources.map((x) => x.id)).toEqual(['p1']);
  });

  it('token OR (comma values)', () => {
    const r = executeSearch(compileSearch('Patient', 'gender=male,female'), seedRepo());
    expect(r.resources.map((x) => x.id).sort()).toEqual(['p1', 'p2']);
  });

  it('AND across params', () => {
    const r = executeSearch(compileSearch('Patient', 'name=smith&gender=male'), seedRepo());
    expect(r.resources.map((x) => x.id)).toEqual(['p1']);
  });

  it('date partial-year and prefix search', () => {
    expect(
      executeSearch(compileSearch('Patient', 'birthdate=1990'), seedRepo()).resources.map(
        (x) => x.id,
      ),
    ).toEqual(['p1']);
    expect(
      executeSearch(compileSearch('Patient', 'birthdate=gt1990-01-01'), seedRepo())
        .resources.map((x) => x.id)
        .sort(),
    ).toEqual(['p1', 'p2']);
    expect(
      executeSearch(compileSearch('Patient', 'birthdate=lt1990-01-01'), seedRepo()).resources.map(
        (x) => x.id,
      ),
    ).toEqual(['p3']);
  });

  it(':missing true/false', () => {
    // p3 has no gender
    const missing = executeSearch(compileSearch('Patient', 'gender:missing=true'), seedRepo());
    expect(missing.resources.map((x) => x.id)).toEqual(['p3']);
    const present = executeSearch(compileSearch('Patient', 'gender:missing=false'), seedRepo());
    expect(present.resources.map((x) => x.id).sort()).toEqual(['p1', 'p2']);
  });

  it('_id token match', () => {
    const r = executeSearch(compileSearch('Patient', '_id=p2'), seedRepo());
    expect(r.resources.map((x) => x.id)).toEqual(['p2']);
  });

  it('reference: literal, bare id, and :Type filter', () => {
    const repo = seedRepo();
    expect(
      executeSearch(compileSearch('Observation', 'subject=Patient/p1'), repo).resources.map(
        (x) => x.id,
      ),
    ).toEqual(['o1']);
    expect(
      executeSearch(compileSearch('Observation', 'subject=p1'), repo).resources.map((x) => x.id),
    ).toEqual(['o1']);
    expect(
      executeSearch(compileSearch('Observation', 'subject:Patient=p1'), repo).resources.map(
        (x) => x.id,
      ),
    ).toEqual(['o1']);
  });

  it('reference chaining resolves the target resource', () => {
    const repo = seedRepo();
    expect(
      executeSearch(compileSearch('Observation', 'subject.name=Smith'), repo).resources.map(
        (x) => x.id,
      ),
    ).toEqual(['o1']);
    expect(
      executeSearch(compileSearch('Observation', 'subject.name=Jones'), repo).resources.map(
        (x) => x.id,
      ),
    ).toEqual(['o2']);
    expect(executeSearch(compileSearch('Observation', 'subject.name=NoSuch'), repo).total).toBe(0);
  });

  it('_sort asc/desc (date)', () => {
    const asc = executeSearch(
      compileSearch('Patient', '_sort=birthdate'),
      seedRepo(),
    ).resources.map((x) => x.id);
    expect(asc).toEqual(['p3', 'p1', 'p2']); // 1985, 1990, 2000
    const desc = executeSearch(
      compileSearch('Patient', '_sort=-birthdate'),
      seedRepo(),
    ).resources.map((x) => x.id);
    expect(desc).toEqual(['p2', 'p1', 'p3']);
  });

  it('_count + _page paginate; total is pre-pagination', () => {
    const repo = seedRepo();
    const page1 = executeSearch(compileSearch('Patient', '_sort=birthdate&_count=2&_page=1'), repo);
    expect(page1.resources).toHaveLength(2);
    expect(page1.total).toBe(3);
    const page2 = executeSearch(compileSearch('Patient', '_sort=birthdate&_count=2&_page=2'), repo);
    expect(page2.resources).toHaveLength(1);
    expect(page2.total).toBe(3);
  });

  it('_count=0 returns no resources but reports total', () => {
    const r = executeSearch(compileSearch('Patient', '_count=0'), seedRepo());
    expect(r.resources).toHaveLength(0);
    expect(r.total).toBe(3);
  });

  it('search() convenience matches executeSearch(compileSearch())', () => {
    const repo = seedRepo();
    const direct = executeSearch(compileSearch('Patient', 'gender=male'), repo);
    const via = search('Patient', 'gender=male', repo);
    expect(via.total).toBe(direct.total);
    expect(via.resources.map((x) => x.id)).toEqual(direct.resources.map((x) => x.id));
    expect(via.total).toBe(1);
  });
});
