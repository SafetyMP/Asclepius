import { SignJWT } from 'jose';
import type { AppConfig } from '@/config';
import type { AccessTokenIssuer, AuthContext } from '@/port/auth';

/**
 * jose-based access-token issuer (HS256). Implements `AccessTokenIssuer`.
 *
 * DEV-ONLY: a real deployment federates identity to an external IdP (Keycloak,
 * Auth0, …) and NEVER mints its own tokens. This exists so the reference server
 * is demoable/testable. The composition root must not construct it in
 * production — the dev `/auth/token` endpoint is the only caller.
 */
export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly config: AppConfig) {}

  async issue(principal: AuthContext): Promise<string> {
    const secret = new TextEncoder().encode(this.config.jwtSecret);
    const scope = principal.scopes.map((s) => `${s.context}/${s.resource}.${s.action}`).join(' ');
    const now = Math.floor(Date.now() / 1000);

    // Custom claims passed via the constructor payload (avoids conditional .set()
    // chaining under exactOptionalPropertyTypes).
    const payload: Record<string, string> = { role: principal.role, scope };
    if (principal.patientId !== undefined) payload.patient_id = principal.patientId;

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setIssuer(this.config.jwtIssuer)
      .setSubject(principal.sub)
      .setExpirationTime(now + this.config.jwtAccessTtlSeconds);
    return jwt.sign(secret);
  }
}
