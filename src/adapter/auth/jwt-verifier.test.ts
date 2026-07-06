import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '@/config';
import { UnauthorizedError } from '@/errors';
import { JwtAccessTokenVerifier } from './jwt-verifier';

const config = () =>
  loadConfig({
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-min-32-chars-xxxxxxxx',
  });

/** Mint a token with given claim overrides and TTL (negative TTL → already expired). */
async function mint(claims: Record<string, unknown> = {}, ttlSeconds = 900): Promise<string> {
  const cfg = config();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ scope: 'system/*.read', role: 'clinician', ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(cfg.jwtIssuer)
    .setSubject('prac-1')
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(new TextEncoder().encode(cfg.jwtSecret));
}

describe('JwtAccessTokenVerifier', () => {
  it('verifies a valid token → AuthContext', async () => {
    const ctx = await new JwtAccessTokenVerifier(config()).verify(await mint());
    expect(ctx.sub).toBe('prac-1');
    expect(ctx.role).toBe('clinician');
    expect(ctx.scopes).toHaveLength(1);
  });

  it('rejects an empty token', async () => {
    await expect(new JwtAccessTokenVerifier(config()).verify('')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects an expired token', async () => {
    await expect(
      new JwtAccessTokenVerifier(config()).verify(await mint({}, -10)),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a token with the wrong issuer', async () => {
    const cfg = config();
    const token = await new SignJWT({ scope: 'system/*.read' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('someone-else')
      .setSubject('p1')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(cfg.jwtSecret));
    await expect(new JwtAccessTokenVerifier(cfg).verify(token)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects a token missing sub', async () => {
    const cfg = config();
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ scope: 'system/*.read' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(cfg.jwtIssuer)
      .setIssuedAt(now)
      .setExpirationTime(now + 900)
      .sign(new TextEncoder().encode(cfg.jwtSecret));
    await expect(new JwtAccessTokenVerifier(cfg).verify(token)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('returns empty scopes when the claim is absent', async () => {
    const cfg = config();
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(cfg.jwtIssuer)
      .setSubject('p1')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(cfg.jwtSecret));
    const ctx = await new JwtAccessTokenVerifier(cfg).verify(token);
    expect(ctx.scopes).toHaveLength(0);
  });
});
