import { Hono } from 'hono';
import type { ResourceType } from '@/domain/fhir';
import type { Logger } from '@/logger';
import type { AuditLogger } from '@/port/audit';
import type { AccessTokenIssuer, AccessTokenVerifier, AuthContext } from '@/port/auth';
import type { CdsService } from '@/port/cds';
import type { ResourceRepository } from '@/port/repository';
import type { SearchFn } from '@/port/search';
import type { ValidationService } from '@/port/validation';
import { errorResponse } from './errors';
import { fhirResponse } from './json';
import { auditMiddleware } from './middleware/audit';
import { authMiddleware } from './middleware/auth';
import { registerRoutes } from './routes';
import { registerAuthRoutes } from './routes/auth';
import { registerCdsRoutes } from './routes/cds';
import { registerValidationRoutes } from './routes/validation';

/**
 * The FHIR REST Hono app factory.
 *
 * Pure: builds and returns a `Hono` instance with all routes + auth middleware
 * + error boundary; it does NOT start a server. The composition root
 * (`src/app.ts`) injects the concrete `ResourceRepository`, `SearchFn`, and
 * (optional) `AuthDeps`. When `auth` is omitted (e.g. focused CRUD/search
 * tests), no auth middleware is applied. Tests compose this and drive it
 * in-process via `app.request(...)`; `src/app.ts` wraps it with `serve()`.
 */

export type AppVariables = { authCtx?: AuthContext };

export interface AuthDeps {
  readonly verifier: AccessTokenVerifier;
  /** Scope/role policy — injected so the adapter imports no `@/service`. */
  readonly can: (
    ctx: AuthContext,
    resourceType: ResourceType,
    action: 'read' | 'write',
    resourceId?: string,
  ) => boolean;
  /** Present only in dev (enables `POST /auth/token`). Never constructed in prod. */
  readonly issuer?: AccessTokenIssuer;
  readonly isDev: boolean;
  readonly accessTtlSeconds: number;
}

export interface HttpDeps {
  readonly repo: ResourceRepository;
  readonly search: SearchFn;
  readonly log?: Logger | undefined;
  readonly auth?: AuthDeps | undefined;
  readonly audit?: AuditLogger | undefined;
  readonly cds?: CdsService | undefined;
  readonly validation?: ValidationService | undefined;
}

export function createHttpApp(deps: HttpDeps): Hono<{ Variables: AppVariables }> {
  const app = new Hono<{ Variables: AppVariables }>();

  // Audit middleware — registered FIRST so it wraps the entire chain (including
  // /auth/token) with `await next()`, recording every request after completion.
  if (deps.audit) {
    app.use('*', auditMiddleware(deps.audit));
  }

  // Public dev-token endpoint — registered before the auth middleware (which
  // also path-skips /auth/) so it is never intercepted.
  if (deps.auth?.issuer) {
    registerAuthRoutes(app, {
      issuer: deps.auth.issuer,
      isDev: deps.auth.isDev,
      accessTtlSeconds: deps.auth.accessTtlSeconds,
    });
  }

  // Auth middleware — applied only when auth deps are provided.
  if (deps.auth) {
    app.use('*', authMiddleware(deps.auth));
  }

  registerRoutes(app, deps);

  // CDS Hooks endpoint (POST /cds-services/:id).
  if (deps.cds) {
    registerCdsRoutes(app, deps);
  }

  // FHIR $validate operation (POST /:type/$validate).
  if (deps.validation) {
    registerValidationRoutes(app, deps);
  }

  app.notFound((c) =>
    fhirResponse(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'fatal',
            code: 'not-found',
            diagnostics: `Unknown route: ${c.req.method} ${c.req.path}`,
          },
        ],
      },
      { status: 404 },
    ),
  );

  app.onError((err) => {
    const { status, body } = errorResponse(err);
    deps.log?.warn(
      { status, err: err instanceof Error ? err.message : String(err) },
      'request error',
    );
    return fhirResponse(body, { status });
  });

  return app;
}
