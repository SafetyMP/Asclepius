import { Hono } from 'hono';
import type { Logger } from '@/logger';
import type { ResourceRepository } from '@/port/repository';
import type { SearchFn } from '@/port/search';
import { errorResponse } from './errors';
import { fhirResponse } from './json';
import { registerRoutes } from './routes';

/**
 * The FHIR REST Hono app factory.
 *
 * Pure: builds and returns a `Hono` instance with all routes + error boundary
 * attached; it does NOT start a server. The composition root (`src/app.ts`)
 * injects the concrete `ResourceRepository` and `SearchFn` (adapter depends on
 * ports + domain only — no `@/service` import). Tests compose this and drive it
 * in-process via `app.request(...)`; `src/app.ts` wraps it with `serve()`.
 */

export interface HttpDeps {
  readonly repo: ResourceRepository;
  /** Search capability (wired in Phase 3; injected here so the seam is fixed). */
  readonly search: SearchFn;
  readonly log?: Logger | undefined;
}

export function createHttpApp(deps: HttpDeps): Hono {
  const app = new Hono();

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

  registerRoutes(app, deps);
  return app;
}
