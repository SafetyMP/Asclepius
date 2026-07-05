import { beforeEach, describe, expect, it } from 'vitest';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import type { ResourceRepository } from '@/port/repository';
import { search } from '@/service/search';

const FHIR_JSON = { 'content-type': 'application/fhir+json' };
const FORM = { 'content-type': 'application/x-www-form-urlencoded' };

function makeApp(): ReturnType<typeof createHttpApp> {
  const repo: ResourceRepository = new InMemoryResourceRepository();
  return createHttpApp({ repo, search });
}

async function post(
  app: ReturnType<typeof createHttpApp>,
  body: Record<string, unknown>,
): Promise<string> {
  const res = await app.request(`/${(body.resourceType as string) ?? 'Patient'}`, {
    method: 'POST',
    headers: FHIR_JSON,
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

type SearchBody = {
  type: string;
  total: number;
  entry?: {
    fullUrl: string;
    resource: { id: string };
    search: { mode: string };
  }[];
  link?: { relation: string; url: string }[];
};

function asSearchset(body: unknown): SearchBody {
  return body as SearchBody;
}

async function seed(app: ReturnType<typeof createHttpApp>): Promise<{
  smith: string;
  jones: string;
  smythe: string;
  obs: string;
}> {
  const smith = await post(app, {
    resourceType: 'Patient',
    name: [{ family: 'Smith' }],
    birthDate: '1990-01-01',
  });
  const jones = await post(app, {
    resourceType: 'Patient',
    name: [{ family: 'Jones' }],
    birthDate: '2000-01-01',
  });
  const smythe = await post(app, {
    resourceType: 'Patient',
    name: [{ family: 'Smythe' }],
    birthDate: '1985-01-01',
  });
  const obs = await post(app, {
    resourceType: 'Observation',
    status: 'final',
    code: { text: 'Sodium' },
    subject: { reference: `Patient/${smith}` },
  });
  return { smith, jones, smythe, obs };
}

describe('FHIR REST — search (Phase 3)', () => {
  let app: ReturnType<typeof createHttpApp>;
  beforeEach(() => {
    app = makeApp();
  });

  it('GET ?{params} returns a searchset Bundle with match entries', async () => {
    const ids = await seed(app);
    const res = await app.request('/Patient?name=smith', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.type).toBe('searchset');
    expect(body.total).toBe(1);
    expect(body.entry?.[0]?.resource.id).toBe(ids.smith);
    expect(body.entry?.[0]?.search.mode).toBe('match');
  });

  it('a shared prefix matches multiple (OR within a param family)', async () => {
    const ids = await seed(app);
    const res = await app.request('/Patient?name=sm', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.total).toBe(2);
    expect(body.entry?.map((e) => e.resource.id).sort()).toEqual([ids.smith, ids.smythe].sort());
  });

  it('no params = match-all', async () => {
    await seed(app);
    const res = await app.request('/Patient', { method: 'GET' });
    expect(res.status).toBe(200);
    expect(asSearchset(await res.json()).total).toBe(3);
  });

  it('_sort orders results (birthdate ascending)', async () => {
    const ids = await seed(app);
    const res = await app.request('/Patient?_sort=birthdate', {
      method: 'GET',
    });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.entry?.map((e) => e.resource.id)).toEqual([ids.smythe, ids.smith, ids.jones]);
  });

  it('_count paginates while total stays pre-pagination', async () => {
    const ids = await seed(app);
    const res = await app.request('/Patient?_sort=birthdate&_count=2', {
      method: 'GET',
    });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.total).toBe(3); // pre-pagination
    expect(body.entry?.map((e) => e.resource.id)).toEqual([ids.smythe, ids.smith]); // page 1
    // page 1 of 2 → self + next, no previous
    expect(body.link?.map((l) => l.relation)).toEqual(['self', 'next']);
    expect(body.link?.[0]?.url).toBe('Patient?_sort=birthdate&_count=2');
    expect(body.link?.[1]?.url).toContain('_page=2');
  });

  it('page 2 of a paginated search carries a previous link', async () => {
    await seed(app);
    const res = await app.request('/Patient?_sort=birthdate&_count=2&_page=2', {
      method: 'GET',
    });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.total).toBe(3);
    expect(body.entry).toHaveLength(1); // 3rd resource on page 2
    // page 2 of 2 → self + previous, no next
    expect(body.link?.map((l) => l.relation)).toEqual(['self', 'previous']);
    expect(body.link?.[1]?.url).toContain('_page=1');
  });

  it('a non-paginated search carries only a self link', async () => {
    await seed(app);
    const res = await app.request('/Patient?name=smith', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.link?.map((l) => l.relation)).toEqual(['self']);
  });

  it('unknown search parameter → 400', async () => {
    await seed(app);
    const res = await app.request('/Patient?bogus=1', { method: 'GET' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { issue: { code: string }[] };
    expect(body.issue[0]?.code).toBe('invalid');
  });

  it('malformed _count → 400', async () => {
    await seed(app);
    const res = await app.request('/Patient?_count=abc', { method: 'GET' });
    expect(res.status).toBe(400);
  });

  it('_page below 1 → 400', async () => {
    await seed(app);
    const res = await app.request('/Patient?_page=0', { method: 'GET' });
    expect(res.status).toBe(400);
  });

  it('POST /_search with urlencoded body matches the GET form', async () => {
    const ids = await seed(app);
    const res = await app.request('/Patient/_search', {
      method: 'POST',
      headers: FORM,
      body: 'name=smith',
    });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.type).toBe('searchset');
    expect(body.total).toBe(1);
    expect(body.entry?.[0]?.resource.id).toBe(ids.smith);
  });

  it('reference chaining resolves across resources', async () => {
    const ids = await seed(app);
    const res = await app.request('/Observation?subject.name=smith', {
      method: 'GET',
    });
    expect(res.status).toBe(200);
    const body = asSearchset(await res.json());
    expect(body.total).toBe(1);
    expect(body.entry?.[0]?.resource.id).toBe(ids.obs);
  });
});
