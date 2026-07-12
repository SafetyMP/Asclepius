import { describe, expect, it } from 'vitest';
import { JwtAccessTokenIssuer } from '@/adapter/auth/jwt-issuer';
import { JwtAccessTokenVerifier } from '@/adapter/auth/jwt-verifier';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import { loadConfig } from '@/config';
import type { FhirResource } from '@/domain/fhir';
import type { AuthContext } from '@/port/auth';
import { parseScopes } from '@/port/auth';
import { can as policyCan } from '@/service/auth/policy';
import { cdsRules } from '@/service/cds/rules';
import { createCdsService } from '@/service/cds/service';
import { search } from '@/service/search';

function makeApp(): {
  app: ReturnType<typeof createHttpApp>;
  repo: InMemoryResourceRepository;
  bearer: (scopes: string) => Promise<string>;
} {
  const config = loadConfig({
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-min-32-chars-xxxxxxxx',
  });
  const repo = new InMemoryResourceRepository();
  const cds = createCdsService(cdsRules, search);
  const verifier = new JwtAccessTokenVerifier(config);
  const issuer = new JwtAccessTokenIssuer(config);
  const app = createHttpApp({
    repo,
    search,
    cds,
    auth: {
      verifier,
      can: policyCan,
      issuer,
      isDev: true,
      accessTtlSeconds: config.jwtAccessTtlSeconds,
    },
  });
  const bearer = async (scopes: string): Promise<string> => {
    const principal: AuthContext = {
      sub: 'tester',
      role: 'system',
      scopes: parseScopes(scopes),
    };
    const token = await issuer.issue(principal);
    return `Bearer ${token}`;
  };
  return { app, repo, bearer };
}

const CDS_REQUEST = JSON.stringify({
  hook: 'patient-view',
  hookInstance: '00000000-0000-0000-0000-000000000000',
  context: { patientId: 'p1' },
});

describe('CDS Hooks HTTP endpoint', () => {
  it('returns cards for a patient with an allergy conflict', async () => {
    const { app, repo, bearer } = makeApp();
    repo.create({
      resourceType: 'AllergyIntolerance',
      id: 'a1',
      patient: { reference: 'Patient/p1' },
      code: { coding: [{ code: '1191' }] },
    } as FhirResource);
    repo.create({
      resourceType: 'MedicationRequest',
      id: 'm1',
      intent: 'order',
      subject: { reference: 'Patient/p1' },
      status: 'active',
      medicationCodeableConcept: { coding: [{ code: '1191' }] },
    } as FhirResource);

    const res = await app.request('/cds-services/all', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: await bearer('system/*.read'),
      },
      body: CDS_REQUEST,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: { summary: string }[] };
    expect(body.cards.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 when context.patientId is missing', async () => {
    const { app, bearer } = makeApp();
    const res = await app.request('/cds-services/all', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: await bearer('system/*.read'),
      },
      body: JSON.stringify({ hook: 'patient-view', context: {} }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 when CDS is not configured (route not registered)', async () => {
    const repo = new InMemoryResourceRepository();
    const app = createHttpApp({ repo, search });
    const res = await app.request('/cds-services/all', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: CDS_REQUEST,
    });
    expect(res.status).toBe(404);
  });
});
