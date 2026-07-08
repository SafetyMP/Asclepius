import { serve } from '@hono/node-server';
import Database from 'better-sqlite3';
import { InMemoryAuditLogger } from '@/adapter/audit/memory/in-memory-audit-logger';
import { SqliteAuditLogger } from '@/adapter/audit/sqlite/sqlite-audit-logger';
import { JwtAccessTokenIssuer } from '@/adapter/auth/jwt-issuer';
import { JwtAccessTokenVerifier } from '@/adapter/auth/jwt-verifier';
import { createHttpApp } from '@/adapter/http/app';
import { InMemoryResourceRepository } from '@/adapter/storage/memory/in-memory-repository';
import { SqliteResourceRepository } from '@/adapter/storage/sqlite/sqlite-repository';
import { loadConfig } from '@/config';
import { SAFETY_BANNER } from '@/domain/safety';
import { getLogger } from '@/logger';
import type { AuditLogger } from '@/port/audit';
import type { ResourceRepository } from '@/port/repository';
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
 * Selects a ResourceRepository by `config.storage` (in-memory default; SQLite
 * for real persistence — ADR 0004), then wires the search service and JWT auth
 * (HS256 verifier + a dev-only issuer that is NEVER constructed in production)
 * into the Hono HTTP adapter and starts the server.
 */
async function main(): Promise<void> {
  console.log(SAFETY_BANNER);

  const config = loadConfig();
  const log = getLogger().child({ component: 'boot' });
  log.info({ config: { ...config, jwtSecret: '[set]' } }, 'configuration loaded');

  const isSqlite = config.storage === 'sqlite';
  const sqlite = isSqlite ? createSqliteAdapters(config.sqlitePath) : undefined;
  const repo: ResourceRepository = sqlite?.repo ?? new InMemoryResourceRepository();
  const audit: AuditLogger = sqlite?.audit ?? new InMemoryAuditLogger();

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
    audit,
  });

  const server = serve({ fetch: app.fetch, port: config.port });
  log.info(`Asclepius FHIR server listening on http://localhost:${config.port}`);

  // Graceful shutdown: stop accepting requests, flush/close SQLite if in use,
  // then exit. Registering the handler reinstates termination (otherwise Node
  // would keep running with a closed DB and a live HTTP server).
  const shutdown = (): void => {
    server.close();
    if (repo instanceof SqliteResourceRepository) {
      repo.close();
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/** Open SQLite-backed resource repo + audit logger (WAL mode, shared DB handle). */
function createSqliteAdapters(path: string): {
  repo: SqliteResourceRepository;
  audit: SqliteAuditLogger;
} {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  return {
    repo: new SqliteResourceRepository(db),
    audit: new SqliteAuditLogger(db),
  };
}

main().catch((err: unknown) => {
  console.error('Boot failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
