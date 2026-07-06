import { serve } from '@hono/node-server';
import { JwtAccessTokenIssuer } from '@/adapter/auth/jwt-issuer';
import { JwtAccessTokenVerifier } from '@/adapter/auth/jwt-verifier';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import { loadConfig } from '@/config';
import { SAFETY_BANNER } from '@/domain/safety';
import { getLogger } from '@/logger';
import { can as policyCan } from '@/service/auth/policy';
import { search } from '@/service/search';

/**
 * Composition root.
 *
 * First principles: in a ports-and-adapters architecture, exactly ONE place
 * decides which adapter implementations satisfy which ports. Centralizing that
 * wiring here means (1) the dependency graph is visible at a glance, (2) tests
 * can swap adapters without touching domain logic, (3) there is no hidden
 * service-locator magic.
 *
 * Wires the in-memory ResourceRepository, the search service, and JWT auth
 * (HS256 verifier + a dev-only issuer that is NEVER constructed in production)
 * into the Hono HTTP adapter and starts the server.
 */
async function main(): Promise<void> {
  console.log(SAFETY_BANNER);

  const config = loadConfig();
  const log = getLogger().child({ component: 'boot' });
  log.info({ config: { ...config, jwtSecret: '[set]' } }, 'configuration loaded');

  const repo = new InMemoryResourceRepository();
  const isDev = config.nodeEnv !== 'production';
  const verifier = new JwtAccessTokenVerifier(config);
  // The issuer is dev-only — never construct it in production, so the
  // /auth/token endpoint cannot exist even if the route were somehow reached.
  const issuer = isDev ? new JwtAccessTokenIssuer(config) : undefined;

  const app = createHttpApp({
    repo,
    search,
    log: log.child({ component: 'http' }),
    auth: {
      verifier,
      can: policyCan,
      isDev,
      accessTtlSeconds: config.jwtAccessTtlSeconds,
      ...(issuer ? { issuer } : {}),
    },
  });

  serve({ fetch: app.fetch, port: config.port });
  log.info(`Asclepius FHIR server listening on http://localhost:${config.port}`);
}

main().catch((err: unknown) => {
  console.error('Boot failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
