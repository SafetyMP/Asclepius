import { z } from 'zod';

/**
 * Typed application configuration.
 *
 * First principles: configuration must be (1) validated at startup so a bad
 * env fails fast, (2) typed so consumers can't read a string as a number,
 * (3) independent of file-based secrets. We read process.env (runtime env),
 * never the contents of a .env file. Secrets must come from the real
 * environment or a secrets manager.
 *
 * zod gives us validation + inferred type in one schema (single source of
 * truth), matching the project-wide convention of schema-as-source.
 */

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const EnvSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().positive().max(65535).default(8787),
  logLevel: z.enum(logLevels).default('info'),
  storage: z.enum(['memory', 'sqlite']).default('memory'),
  sqlitePath: z.string().default('asclepius.db'),
  jwtSecret: z.string().min(1),
  jwtIssuer: z.string().default('asclepius'),
  jwtAccessTtlSeconds: z.coerce.number().int().positive().default(900),
});

export type AppConfig = z.infer<typeof EnvSchema>;

/**
 * Load and validate config. Pure: parses the given env and returns (or throws).
 * No module-level cache — caching is a composition-root concern (call once in
 * app.ts, inject the result). A pure loader is trivially testable with no
 * isolation headaches.
 *
 * In production, a missing JWT secret is a hard error (we never silently
 * invent a production signing key). In development/test we provide a known
 * dev key so `npm run dev` works out of the box.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isProd = env.NODE_ENV === 'production';
  const devSecret = 'dev-secret-do-not-use-in-production-CHANGE-ME';

  // Explicit UPPERCASE env var → config field mapping. (Earlier this used a
  // bare `...env` spread, which copied UPPERCASE keys the lowercase schema
  // never read — every env var silently fell back to its default. Mapping
  // explicitly also documents exactly which env vars are honored.)
  const parsed = EnvSchema.safeParse({
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    storage: env.STORAGE,
    sqlitePath: env.SQLITE_PATH,
    jwtIssuer: env.JWT_ISSUER,
    jwtAccessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
    jwtSecret: env.JWT_SECRET ?? (isProd ? undefined : devSecret),
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }

  return parsed.data;
}
