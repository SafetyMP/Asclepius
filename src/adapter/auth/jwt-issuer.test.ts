import { describe, expect, it } from 'vitest';
import { loadConfig } from '@/config';
import type { AuthContext } from '@/port/auth';
import { JwtAccessTokenIssuer } from './jwt-issuer';
import { JwtAccessTokenVerifier } from './jwt-verifier';

const config = () =>
  loadConfig({
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-min-32-chars-xxxxxxxx',
  });

describe('JwtAccessTokenIssuer', () => {
  it('issues a token that the verifier round-trips', async () => {
    const principal: AuthContext = {
      sub: 'prac-1',
      role: 'clinician',
      scopes: [
        { context: 'system', resource: 'Patient', action: 'read' },
        { context: 'system', resource: '*', action: 'write' },
      ],
    };
    const token = await new JwtAccessTokenIssuer(config()).issue(principal);
    const verified = await new JwtAccessTokenVerifier(config()).verify(token);
    expect(verified.sub).toBe('prac-1');
    expect(verified.role).toBe('clinician');
    // serialize → parse round-trip preserves the scope set
    expect(verified.scopes).toEqual(principal.scopes);
  });

  it('carries patientId when present', async () => {
    const token = await new JwtAccessTokenIssuer(config()).issue({
      sub: 'pat-1',
      role: 'patient',
      scopes: [{ context: 'patient', resource: 'Patient', action: 'read' }],
      patientId: 'pat-1',
    });
    const verified = await new JwtAccessTokenVerifier(config()).verify(token);
    expect(verified.patientId).toBe('pat-1');
  });
});
