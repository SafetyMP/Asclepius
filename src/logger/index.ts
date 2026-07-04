import pino, { type Logger } from 'pino';
import { loadConfig } from '@/config';

/**
 * Structured logger (pino).
 *
 * First principles: in a multi-subsystem service, logs must be (1) structured
 * (machine-parseable JSON), (2) correlated (request ids), (3) leveled. pino is
 * the fastest structured logger in the Node ecosystem and emits JSON by
 * default, which is what log aggregators expect.
 *
 * A single root logger is created here; subsystems derive children with
 * `logger.child({ component: '...' })` so every line carries its origin.
 */

let root: Logger | null = null;

export function getLogger(): Logger {
  if (root) return root;
  const config = loadConfig();
  root = pino({
    level: config.logLevel,
    base: { service: 'asclepius', env: config.nodeEnv },
    redact: {
      // never log credential-shaped fields, even if a caller passes them
      paths: [
        'jwtSecret',
        'password',
        'secret',
        'token',
        'authorization',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  });
  return root;
}

export function createLogger(component: string): Logger {
  return getLogger().child({ component });
}

/** Test-only: reset the singleton so tests can reconfigure logging. */
export function __resetLoggerForTests(): void {
  root = null;
}

export type { Logger } from 'pino';
