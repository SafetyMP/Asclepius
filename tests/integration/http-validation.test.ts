import { describe, expect, it } from 'vitest';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import { search } from '@/service/search';
import { validationRules } from '@/service/validation/rules';
import { createValidationService } from '@/service/validation/service';

const FHIR_JSON = { 'content-type': 'application/fhir+json' };

function makeApp(): ReturnType<typeof createHttpApp> {
  const repo = new InMemoryResourceRepository();
  const validation = createValidationService(validationRules);
  return createHttpApp({ repo, search, validation });
}

describe('FHIR $validate endpoint', () => {
  it('returns 200 + empty issues for a valid resource', async () => {
    const app = makeApp();
    const res = await app.request('/Patient/$validate', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({
        resourceType: 'Patient',
        name: [{ family: 'Doe' }],
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { issue: unknown[] };
    expect(body.issue).toHaveLength(0);
  });

  it('returns 200 + profile issues for a Patient with no identity', async () => {
    const app = makeApp();
    const res = await app.request('/Patient/$validate', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({ resourceType: 'Patient' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { issue: { diagnostics: string }[] };
    expect(body.issue.some((i) => i.diagnostics.includes('identifier or name'))).toBe(true);
  });

  it('returns 200 + structural issues for schema-invalid input', async () => {
    const app = makeApp();
    const res = await app.request('/Patient/$validate', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({ resourceType: 'Patient', gender: 'bogus' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { issue: { code: string }[] };
    expect(body.issue.some((i) => i.code === 'invalid')).toBe(true);
  });

  it('returns 415 for wrong content-type', async () => {
    const app = makeApp();
    const res = await app.request('/Patient/$validate', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: '{}',
    });
    expect(res.status).toBe(415);
  });

  it('returns 404 for an unsupported resource type', async () => {
    const app = makeApp();
    const res = await app.request('/NotAType/$validate', {
      method: 'POST',
      headers: FHIR_JSON,
      body: '{}',
    });
    expect(res.status).toBe(404);
  });
});

describe('create/update profile validation integration', () => {
  it('rejects a profile-invalid Patient on create (422)', async () => {
    const app = makeApp();
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({ resourceType: 'Patient' }),
    });
    expect(res.status).toBe(422);
  });

  it('accepts a profile-valid Patient on create (201)', async () => {
    const app = makeApp();
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: FHIR_JSON,
      body: JSON.stringify({
        resourceType: 'Patient',
        name: [{ family: 'Doe' }],
      }),
    });
    expect(res.status).toBe(201);
  });
});
