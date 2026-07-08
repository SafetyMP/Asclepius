import { describe, expect, it } from 'vitest';
import { InMemoryAuditLogger } from '@/adapter/audit/memory/in-memory-audit-logger';
import { JwtAccessTokenIssuer } from '@/adapter/auth/jwt-issuer';
import { JwtAccessTokenVerifier } from '@/adapter/auth/jwt-verifier';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import { loadConfig } from '@/config';
import type { FhirResource } from '@/domain/fhir';
import type { AuditLogger } from '@/port/audit';
import type { AuthContext } from '@/port/auth';
import { parseScopes } from '@/port/auth';
import { can as policyCan } from '@/service/auth/policy';
import { search } from '@/service/search';

function setup(): {
  app: ReturnType<typeof createHttpApp>;
  audit: InMemoryAuditLogger;
  repo: InMemoryResourceRepository;
  issuer: JwtAccessTokenIssuer;
} {
  const config = loadConfig({
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-min-32-chars-xxxxxxxx',
  });
  const repo = new InMemoryResourceRepository();
  const audit = new InMemoryAuditLogger();
  const issuer = new JwtAccessTokenIssuer(config);
  const verifier = new JwtAccessTokenVerifier(config);
  const app = createHttpApp({
    repo,
    search,
    auth: {
      verifier,
      can: policyCan,
      issuer,
      isDev: true,
      accessTtlSeconds: 900,
    },
    audit,
  });
  return { app, audit, repo, issuer };
}

async function bearer(issuer: JwtAccessTokenIssuer, scopes: string): Promise<string> {
  const principal: AuthContext = {
    sub: 'tester',
    role: 'system',
    scopes: parseScopes(scopes),
  };
  return `Bearer ${await issuer.issue(principal)}`;
}

describe('FHIR REST — audit middleware', () => {
  it('records a successful authenticated request', async () => {
    const { app, audit, repo, issuer } = setup();
    repo.create({ resourceType: 'Patient', id: 'p1' } as FhirResource);
    const res = await app.request('/Patient/p1', {
      method: 'GET',
      headers: { authorization: await bearer(issuer, 'system/Patient.read') },
    });
    expect(res.status).toBe(200);
    expect(audit.verify()).toMatchObject({ ok: true, totalEntries: 1 });
    const entry = audit.__getAllEntries()[0];
    expect(entry?.principal.sub).toBe('tester');
    expect(entry?.method).toBe('GET');
    expect(entry?.status).toBe(200);
    expect(entry?.resourceType).toBe('Patient');
    expect(entry?.resourceId).toBe('p1');
  });

  it('records a 403 (insufficient scope)', async () => {
    const { app, audit, issuer } = setup();
    const res = await app.request('/Patient', {
      method: 'GET',
      headers: {
        authorization: await bearer(issuer, 'system/Observation.read'),
      },
    });
    expect(res.status).toBe(403);
    expect(audit.__getAllEntries()[0]?.status).toBe(403);
  });

  it('records a 404 (unknown route)', async () => {
    const { app, audit, issuer } = setup();
    const res = await app.request('/foo', {
      method: 'GET',
      headers: { authorization: await bearer(issuer, 'system/*.*') },
    });
    expect(res.status).toBe(404);
    expect(audit.__getAllEntries()[0]?.status).toBe(404);
  });

  it('records POST /auth/token with anonymous principal', async () => {
    const { app, audit } = setup();
    const res = await app.request('/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sub: 'dev', scopes: 'system/*.read' }),
    });
    expect(res.status).toBe(200);
    const entry = audit.__getAllEntries()[0];
    expect(entry?.principal.sub).toBe('system:anonymous');
    expect(entry?.path).toBe('/auth/token');
    expect(entry?.status).toBe(200);
  });

  it('never breaks the response if logging throws', async () => {
    const config = loadConfig({ NODE_ENV: 'test', JWT_SECRET: 'x'.repeat(32) });
    const repo = new InMemoryResourceRepository();
    const throwingLogger: AuditLogger = {
      record: () => {
        throw new Error('audit failure');
      },
      verify: () => ({ ok: true, totalEntries: 0 }),
    };
    const app = createHttpApp({
      repo,
      search,
      auth: {
        verifier: new JwtAccessTokenVerifier(config),
        can: policyCan,
        issuer: new JwtAccessTokenIssuer(config),
        isDev: true,
        accessTtlSeconds: 900,
      },
      audit: throwingLogger,
    });
    const res = await app.request('/Patient', {
      method: 'GET',
      headers: {
        authorization: await bearer(new JwtAccessTokenIssuer(config), 'system/*.*'),
      },
    });
    // response still succeeds despite the audit throw
    expect([200, 401]).toContain(res.status);
  });
});
