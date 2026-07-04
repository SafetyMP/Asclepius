import { describe, expect, it } from 'vitest';
import { loadConfig } from '@/config';
import { ConflictError, NotFoundError, toOperationOutcome } from '@/errors';

describe('config', () => {
  it('applies defaults in development', () => {
    const cfg = loadConfig({ NODE_ENV: 'development' });
    expect(cfg.port).toBe(8787);
    expect(cfg.storage).toBe('memory');
    expect(cfg.jwtIssuer).toBe('asclepius');
    // dev secret auto-provided so `npm run dev` works out of the box
    expect(cfg.jwtSecret).toMatch(/dev-secret/);
  });

  it('coerces numeric env values', () => {
    const cfg = loadConfig({ NODE_ENV: 'test', PORT: '9100' });
    expect(cfg.port).toBe(9100);
  });

  it('rejects invalid config with a readable error', () => {
    expect(() => loadConfig({ NODE_ENV: 'development', PORT: 'not-a-port' })).toThrow(
      /Invalid configuration/,
    );
  });

  it('hard-fails on missing JWT secret in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/Invalid configuration/);
  });

  it('accepts an explicit JWT secret in production', () => {
    const cfg = loadConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-real-secret',
    });
    expect(cfg.jwtSecret).toBe('a-real-secret');
  });
});

describe('errors → OperationOutcome', () => {
  it('renders a NotFoundError as a FHIR OperationOutcome', () => {
    const outcome = new NotFoundError('Patient/missing not found').toOperationOutcome();
    expect(outcome).toEqual({
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'not-found',
          diagnostics: 'Patient/missing not found',
        },
      ],
    });
  });

  it('carries the right HTTP status per error type', () => {
    expect(new NotFoundError('x').status).toBe(404);
    expect(new ConflictError('x').status).toBe(409);
  });

  it('the generic boundary hides unknown errors (no stack leak)', () => {
    const outcome = toOperationOutcome(new Error('db password is hunter2'));
    expect(outcome.issue[0]?.severity).toBe('fatal');
    expect(outcome.issue[0]?.code).toBe('exception');
    expect(outcome.issue[0]?.diagnostics).toBe('Internal error');
  });
});
