import { type JWTPayload, jwtVerify } from 'jose';
import type { AppConfig } from '@/config';
import { UnauthorizedError } from '@/errors';
import type { AccessTokenVerifier, AuthContext } from '@/port/auth';
import { parseScopes } from '@/port/auth';

/**
 * jose-based access-token verifier (HS256). Implements `AccessTokenVerifier`.
 *
 * Verifies signature + issuer + expiry (jose checks `exp` automatically) and
 * extracts the principal claims. Any failure → `UnauthorizedError` (→ 401 via
 * the HTTP error boundary). The secret comes from `config.jwtSecret`.
 */
export class JwtAccessTokenVerifier implements AccessTokenVerifier {
  constructor(private readonly config: AppConfig) {}

  async verify(token: string): Promise<AuthContext> {
    if (token === '') throw new UnauthorizedError('Missing bearer token');
    const secret = new TextEncoder().encode(this.config.jwtSecret);

    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
        issuer: this.config.jwtIssuer,
      }));
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (sub === undefined) throw new UnauthorizedError('Token missing required sub claim');

    const scopeClaim = typeof payload.scope === 'string' ? payload.scope : '';
    const role = typeof payload.role === 'string' ? payload.role : 'unknown';
    const patientId = typeof payload.patient_id === 'string' ? payload.patient_id : undefined;

    const ctx: AuthContext = {
      sub,
      role,
      scopes: parseScopes(scopeClaim),
      ...(patientId !== undefined ? { patientId } : {}),
    };
    return ctx;
  }
}
