import { beforeEach, describe, expect, it } from 'vitest';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import type { ResourceRepository } from '@/port/repository';
import { search } from '@/service/search';

const FHIR_JSON = { 'content-type': 'application/fhir+json' };

function makeApp(): {
  app: ReturnType<typeof createHttpApp>;
  repo: ResourceRepository;
} {
  const repo: ResourceRepository = new InMemoryResourceRepository();
  return { app: createHttpApp({ repo, search }), repo };
}

/** POST a Patient, returning the parsed stored resource (with its server id). */
async function createPatient(
  app: ReturnType<typeof createHttpApp>,
  body: Record<string, unknown> = { resourceType: 'Patient' },
): Promise<{ id: string; meta: { versionId: string } } & Record<string, unknown>> {
  const res = await app.request('/Patient', {
    method: 'POST',
    headers: FHIR_JSON,
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; meta: { versionId: string } };
}

describe('FHIR REST — create / read / vread / update / delete', () => {
  let app: ReturnType<typeof createHttpApp>;
  beforeEach(() => {
    ({ app } = makeApp());
  });

  it('POST creates with 201 + Location/ETag + server-stamped meta', async () => {
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({
        resourceType: 'Patient',
        name: [{ family: 'Doe' }],
      }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get('location')).toMatch(/^Patient\/[A-Za-z0-9-.]+$/);
    expect(res.headers.get('etag')).toBe('W/"1"');
    expect(res.headers.get('content-location')).toMatch(/\/_history\/1$/);
    expect(res.headers.get('last-modified')).toMatch(/GMT$/);
    const body = (await res.json()) as {
      id: string;
      meta: { versionId: string; lastUpdated: string };
    };
    expect(body.id).toBeTruthy();
    expect(body.meta.versionId).toBe('1');
    expect(body.meta.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('GET reads the current version with an ETag', async () => {
    const created = await createPatient(app);
    const res = await app.request(`/Patient/${created.id}`, { method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('W/"1"');
    expect(res.headers.get('last-modified')).toMatch(/GMT$/);
    expect(((await res.json()) as { id: string }).id).toBe(created.id);
  });

  it('GET .../_history/{vid} reads a specific version', async () => {
    const created = await createPatient(app);
    await app.request(`/Patient/${created.id}`, {
      method: 'PUT',
      headers: FHIR_JSON,
      body: JSON.stringify({
        resourceType: 'Patient',
        id: created.id,
        active: true,
      }),
    });
    const v1 = await app.request(`/Patient/${created.id}/_history/1`, {
      method: 'GET',
    });
    expect(v1.status).toBe(200);
    expect(((await v1.json()) as { active?: boolean }).active).toBeUndefined();
  });

  it('PUT updates an existing resource (200, version increments)', async () => {
    const created = await createPatient(app);
    const res = await app.request(`/Patient/${created.id}`, {
      method: 'PUT',
      headers: FHIR_JSON,
      body: JSON.stringify({
        resourceType: 'Patient',
        id: created.id,
        active: true,
      }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('W/"2"');
    expect(((await res.json()) as { meta: { versionId: string }; active?: boolean }).active).toBe(
      true,
    );
  });

  it('PUT creates on update (201 for a never-existed id)', async () => {
    const res = await app.request('/Patient/brand-new', {
      method: 'PUT',
      headers: FHIR_JSON,
      body: JSON.stringify({ resourceType: 'Patient', id: 'brand-new' }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get('location')).toBe('Patient/brand-new');
  });

  it('DELETE removes the resource (204) and subsequent read is 404', async () => {
    const created = await createPatient(app);
    const del = await app.request(`/Patient/${created.id}`, {
      method: 'DELETE',
    });
    expect(del.status).toBe(204);
    expect(await del.text()).toBe('');
    const after = await app.request(`/Patient/${created.id}`, {
      method: 'GET',
    });
    expect(after.status).toBe(404);
    const body = (await after.json()) as {
      resourceType: string;
      issue: { code: string }[];
    };
    expect(body.resourceType).toBe('OperationOutcome');
    expect(body.issue[0]?.code).toBe('not-found');
  });
});

describe('FHIR REST — error paths', () => {
  let app: ReturnType<typeof createHttpApp>;
  beforeEach(() => {
    ({ app } = makeApp());
  });

  it('unknown resource type → 404 OperationOutcome', async () => {
    const res = await app.request('/NotAType/1', { method: 'GET' });
    expect(res.status).toBe(404);
  });

  it('malformed id → 400', async () => {
    const res = await app.request('/Patient/_bad', { method: 'GET' });
    expect(res.status).toBe(400);
  });

  it('schema-invalid body → 422 OperationOutcome', async () => {
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({ resourceType: 'Patient', gender: 'martian' }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as {
      issue: { code: string; expression: string[] }[];
    };
    expect(body.issue[0]?.code).toBe('invalid');
    expect(body.issue[0]?.expression).toContain('gender');
  });

  it('missing Content-Type → 415', async () => {
    const res = await app.request('/Patient', {
      method: 'POST',
      body: JSON.stringify({ resourceType: 'Patient' }),
    });
    expect(res.status).toBe(415);
  });

  it('wrong Content-Type → 415', async () => {
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not fhir',
    });
    expect(res.status).toBe(415);
  });

  it('body resourceType mismatching URL type → 400', async () => {
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'x' },
      }),
    });
    expect(res.status).toBe(400);
  });

  it('unknown route → 404 OperationOutcome (not HTML)', async () => {
    const res = await app.request('/foo/bar/baz', { method: 'GET' });
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/fhir+json');
  });

  it('read of a never-existed resource → 404 not-found', async () => {
    const res = await app.request('/Patient/never-existed', { method: 'GET' });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { issue: { code: string }[] };
    expect(body.issue[0]?.code).toBe('not-found');
  });

  it('vread of a non-existent version → 404', async () => {
    const created = await createPatient(app);
    const res = await app.request(`/Patient/${created.id}/_history/999`, {
      method: 'GET',
    });
    expect(res.status).toBe(404);
  });

  it('PUT with wrong Content-Type → 415 (parity with POST)', async () => {
    const res = await app.request('/Patient/some-id', {
      method: 'PUT',
      headers: { 'content-type': 'text/plain' },
      body: 'not fhir',
    });
    expect(res.status).toBe(415);
  });

  it('PUT body id mismatching URL id → 400', async () => {
    const res = await app.request('/Patient/p1', {
      method: 'PUT',
      headers: FHIR_JSON,
      body: JSON.stringify({ resourceType: 'Patient', id: 'p2' }),
    });
    expect(res.status).toBe(400);
  });
});
