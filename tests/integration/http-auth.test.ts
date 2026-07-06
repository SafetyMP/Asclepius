import { beforeEach, describe, expect, it } from 'vitest';
import { JwtAccessTokenIssuer } from '@/adapter/auth/jwt-issuer';
import { JwtAccessTokenVerifier } from '@/adapter/auth/jwt-verifier';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import { loadConfig } from '@/config';
import type { FhirResource } from '@/domain/fhir';
import type { AuthContext } from '@/port/auth';
import { parseScopes } from '@/port/auth';
import type { ResourceRepository } from '@/port/repository';
import { can as policyCan } from '@/service/auth/policy';
import { search } from '@/service/search';

const FHIR_JSON = { 'content-type': 'application/fhir+json' };

function makeAuthApp(): {
  app: ReturnType<typeof createHttpApp>;
  issuer: JwtAccessTokenIssuer;
  repo: ResourceRepository;
} {
  const config = loadConfig({
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-min-32-chars-xxxxxxxx',
  });
  const repo: ResourceRepository = new InMemoryResourceRepository();
  const verifier = new JwtAccessTokenVerifier(config);
  const issuer = new JwtAccessTokenIssuer(config);
  const app = createHttpApp({
    repo,
    search,
    auth: {
      verifier,
      can: policyCan,
      issuer,
      isDev: true,
      accessTtlSeconds: config.jwtAccessTtlSeconds,
    },
  });
  return { app, issuer, repo };
}

/** Mint a bearer header for the given SMART scope string. */
async function bearer(
  issuer: JwtAccessTokenIssuer,
  scopes: string,
  role = 'system',
): Promise<string> {
  const principal: AuthContext = {
    sub: 'tester',
    role,
    scopes: parseScopes(scopes),
  };
  return `Bearer ${await issuer.issue(principal)}`;
}

describe('FHIR REST — auth (JWT + SMART scopes)', () => {
  let app: ReturnType<typeof createHttpApp>;
  let issuer: JwtAccessTokenIssuer;
  let repo: ResourceRepository;
  beforeEach(() => {
    ({ app, issuer, repo } = makeAuthApp());
  });

  it('rejects a request with no Authorization header → 401', async () => {
    const res = await app.request('/Patient', { method: 'GET' });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { issue: { code: string }[] };
    expect(body.issue[0]?.code).toBe('login');
  });

  it('rejects an insufficient scope → 403', async () => {
    const res = await app.request('/Patient', {
      method: 'GET',
      headers: {
        authorization: await bearer(issuer, 'system/Observation.read'),
      },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { issue: { code: string }[] };
    expect(body.issue[0]?.code).toBe('forbidden');
  });

  it('allows a matching read scope → 200', async () => {
    repo.create({ resourceType: 'Patient', id: 'p1' } as FhirResource);
    const res = await app.request('/Patient/p1', {
      method: 'GET',
      headers: { authorization: await bearer(issuer, 'system/Patient.read') },
    });
    expect(res.status).toBe(200);
  });

  it('treats read scope as NOT covering write → 403 on POST', async () => {
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: {
        ...(await authHeaders(issuer, 'system/Patient.read')),
      },
      body: JSON.stringify({ resourceType: 'Patient' }),
    });
    expect(res.status).toBe(403);
  });

  it('allows a matching write scope → 201', async () => {
    const res = await app.request('/Patient', {
      method: 'POST',
      headers: await authHeaders(issuer, 'system/Patient.write'),
      body: JSON.stringify({ resourceType: 'Patient' }),
    });
    expect(res.status).toBe(201);
  });

  it('wildcard scope grants everything', async () => {
    const res = await app.request('/Patient', {
      method: 'GET',
      headers: { authorization: await bearer(issuer, 'system/*.*') },
    });
    expect(res.status).toBe(200);
  });

  it('write scope covers DELETE', async () => {
    repo.create({ resourceType: 'Patient', id: 'p1' } as FhirResource);
    const res = await app.request('/Patient/p1', {
      method: 'DELETE',
      headers: { authorization: await bearer(issuer, 'system/Patient.write') },
    });
    expect(res.status).toBe(204);
  });

  it('POST /{Type}/_search is a read (read scope → 200, not 403)', async () => {
    repo.create({ resourceType: 'Patient', id: 'p1' } as FhirResource);
    const res = await app.request('/Patient/_search', {
      method: 'POST',
      headers: {
        authorization: await bearer(issuer, 'system/Patient.read'),
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: '_count=10',
    });
    expect(res.status).toBe(200);
  });

  it('POST /auth/token mints a usable token (dev only)', async () => {
    const mint = await app.request('/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sub: 'dev-user', scopes: 'system/Patient.read' }),
    });
    expect(mint.status).toBe(200);
    const tokenBody = (await mint.json()) as {
      access_token: string;
      token_type: string;
    };
    expect(tokenBody.token_type).toBe('Bearer');

    // the minted token works on a protected endpoint
    const res = await app.request('/Patient/p1', {
      method: 'GET',
      headers: { authorization: `Bearer ${tokenBody.access_token}` },
    });
    expect([200, 404]).toContain(res.status); // 404 if p1 absent; auth passed either way
  });

  /** Build headers with both the bearer token and the fhir+json content type. */
  async function authHeaders(
    iss: JwtAccessTokenIssuer,
    scopes: string,
  ): Promise<Record<string, string>> {
    return { authorization: await bearer(iss, scopes), ...FHIR_JSON };
  }
});
