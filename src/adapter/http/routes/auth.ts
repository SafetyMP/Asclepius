import type { Env, Hono } from 'hono';
import { z } from 'zod';
import { BadRequestError } from '@/errors';
import type { AccessTokenIssuer, AuthContext } from '@/port/auth';
import { parseScopes } from '@/port/auth';

/**
 * Dev-only auth routes — `POST /auth/token`.
 *
 * A real deployment NEVER mints its own tokens (an external IdP does). This
 * endpoint exists so the reference server is demoable/testable. It MUST be
 * gated on `isDev` (production returns 403) and the issuer is not even
 * constructed in production (composition root). Reference: ADR 0008.
 */
const DevTokenRequest = z.object({
  sub: z.string().min(1),
  role: z.string().default('practitioner'),
  scopes: z.string().default('system/*.*'),
  patientId: z.string().optional(),
});

export interface AuthRouteDeps {
  readonly issuer: AccessTokenIssuer;
  readonly isDev: boolean;
  readonly accessTtlSeconds: number;
}

export function registerAuthRoutes<E extends Env>(app: Hono<E>, deps: AuthRouteDeps): void {
  app.post('/auth/token', async (c) => {
    if (!deps.isDev) {
      return c.json(
        {
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'forbidden',
              diagnostics: 'Token issuance is disabled in production.',
            },
          ],
        },
        403,
      );
    }

    const parsed = DevTokenRequest.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      throw new BadRequestError('Invalid /auth/token request body');
    }
    const requested = parsed.data.scopes.split(/\s+/).filter((s) => s.length > 0);
    const scopes = parseScopes(parsed.data.scopes);
    if (scopes.length !== requested.length) {
      throw new BadRequestError(`Unparseable scope(s) in: ${parsed.data.scopes}`);
    }

    const principal: AuthContext = {
      sub: parsed.data.sub,
      role: parsed.data.role,
      scopes,
      ...(parsed.data.patientId !== undefined ? { patientId: parsed.data.patientId } : {}),
    };
    const accessToken = await deps.issuer.issue(principal);
    return c.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: deps.accessTtlSeconds,
        scope: parsed.data.scopes,
      },
      200,
    );
  });
}
