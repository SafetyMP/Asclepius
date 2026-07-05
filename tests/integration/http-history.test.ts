import { beforeEach, describe, expect, it } from 'vitest';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import type { ResourceRepository } from '@/port/repository';
import { search } from '@/service/search';

const FHIR_JSON = { 'content-type': 'application/fhir+json' };

function makeApp(): ReturnType<typeof createHttpApp> {
  const repo: ResourceRepository = new InMemoryResourceRepository();
  return createHttpApp({ repo, search });
}

/** POST a Patient, returning its server-assigned id. */
async function createPatient(app: ReturnType<typeof createHttpApp>): Promise<string> {
  const res = await app.request('/Patient', {
    method: 'POST',
    headers: FHIR_JSON,
    body: JSON.stringify({ resourceType: 'Patient' }),
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

async function putPatient(app: ReturnType<typeof createHttpApp>, id: string): Promise<void> {
  const res = await app.request(`/Patient/${id}`, {
    method: 'PUT',
    headers: FHIR_JSON,
    body: JSON.stringify({ resourceType: 'Patient', id }),
  });
  expect(res.status).toBe(200);
}

/** ms delay so the repo's ms-precision `lastUpdated` stamps are distinct. */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

type HistoryEntry = {
  fullUrl: string;
  request: { method: 'POST' | 'PUT'; url: string };
  response: { status: string; etag: string; lastModified: string };
};

function asHistory(body: unknown): {
  type: string;
  total: number;
  entry: HistoryEntry[];
} {
  return body as { type: string; total: number; entry: HistoryEntry[] };
}

describe('FHIR REST — history (Phase 2)', () => {
  let app: ReturnType<typeof createHttpApp>;
  beforeEach(() => {
    app = makeApp();
  });

  it('instance history returns a history Bundle, newest-first, with derived method/status', async () => {
    const id = await createPatient(app); // v1 (POST/201)
    await putPatient(app, id); // v2 (PUT/200)
    await putPatient(app, id); // v3 (PUT/200)

    const res = await app.request(`/Patient/${id}/_history`, { method: 'GET' });
    expect(res.status).toBe(200);
    const body = asHistory(await res.json());
    expect(body.type).toBe('history');
    expect(body.total).toBe(3);

    // newest first
    expect(body.entry[0]?.response.etag).toBe('W/"3"');
    expect(body.entry[0]?.request.method).toBe('PUT');
    expect(body.entry[0]?.response.status).toBe('200');
    expect(body.entry[0]?.response.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(body.entry[0]?.fullUrl).toBe(`Patient/${id}`);

    // oldest last = the original create
    expect(body.entry[2]?.response.etag).toBe('W/"1"');
    expect(body.entry[2]?.request.method).toBe('POST');
    expect(body.entry[2]?.response.status).toBe('201');
  });

  it('type history aggregates version chains across current resources, newest-first', async () => {
    const a = await createPatient(app); // v1 @ t1
    await sleep(2);
    const b = await createPatient(app); // v1 @ t2
    await sleep(2);
    await putPatient(app, b); // b v2 @ t3

    const res = await app.request('/Patient/_history', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = asHistory(await res.json());
    expect(body.type).toBe('history');
    expect(body.total).toBe(3); // a:1 + b:2

    // newest-first by lastModified: the most-recent version (b v2) leads,
    // the oldest (a v1) is last — exercises the type-history sort.
    expect(body.entry.map((e) => e.response.etag)).toEqual(['W/"2"', 'W/"1"', 'W/"1"']);
    expect(body.entry[0]?.fullUrl).toBe(`Patient/${b}`);
    expect(body.entry[0]?.response.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(body.entry[2]?.fullUrl).toBe(`Patient/${a}`);
  });

  it('type history excludes soft-deleted resources (documented limitation)', async () => {
    const a = await createPatient(app); // will be deleted
    const b = await createPatient(app);

    const del = await app.request(`/Patient/${a}`, { method: 'DELETE' });
    expect(del.status).toBe(204);

    // type history is built from list(), which excludes deleted resources →
    // a's prior versions do not appear (no tombstone version exists).
    const res = await app.request('/Patient/_history', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = asHistory(await res.json());
    expect(body.total).toBe(1);
    expect(body.entry.every((e) => e.fullUrl !== `Patient/${a}`)).toBe(true);
    expect(body.entry[0]?.fullUrl).toBe(`Patient/${b}`);

    // …but instance history of the deleted resource still returns its prior versions.
    const inst = await app.request(`/Patient/${a}/_history`, { method: 'GET' });
    expect(inst.status).toBe(200);
    expect(asHistory(await inst.json()).total).toBe(1);
  });

  it('instance history of a never-existed resource → 404', async () => {
    const res = await app.request('/Patient/ghost/_history', { method: 'GET' });
    expect(res.status).toBe(404);
  });
});
