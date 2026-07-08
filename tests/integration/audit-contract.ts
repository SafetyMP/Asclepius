import { beforeEach, describe, expect, it } from 'vitest';
import { type AuditInput, type AuditLogger, GENESIS_HASH } from '@/port/audit';

/** Shared audit-contract suite — proves both adapters honor the hash-chain contract (ADR 0009). */
export function defineAuditContract(
  name: string,
  makeLogger: () => { logger: AuditLogger; mutateEntry: (seq: number) => void },
): void {
  describe(`${name} — audit contract`, () => {
    let logger: AuditLogger;
    let mutateEntry: (seq: number) => void;

    beforeEach(() => {
      ({ logger, mutateEntry } = makeLogger());
    });

    function makeInput(overrides: Partial<AuditInput> = {}): AuditInput {
      return {
        principal: {
          sub: 'user-1',
          role: 'system',
          scopesJson: '["system/*.read"]',
        },
        method: 'GET',
        path: '/Patient/p1',
        resourceType: 'Patient',
        resourceId: 'p1',
        status: 200,
        ...overrides,
      };
    }

    it('record stamps sequence 1, genesis prevHash, and a 64-char hash', () => {
      const e = logger.record(makeInput());
      expect(e.sequence).toBe(1);
      expect(e.prevHash).toBe(GENESIS_HASH);
      expect(e.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('sequence increments and prevHash chains', () => {
      const e1 = logger.record(makeInput());
      const e2 = logger.record(makeInput({ method: 'POST', status: 201 }));
      expect(e2.sequence).toBe(2);
      expect(e2.prevHash).toBe(e1.hash);
    });

    it('verify returns ok on a valid chain', () => {
      logger.record(makeInput());
      logger.record(makeInput());
      expect(logger.verify()).toEqual({ ok: true, totalEntries: 2 });
    });

    it('verify returns ok on an empty chain', () => {
      expect(logger.verify()).toEqual({ ok: true, totalEntries: 0 });
    });

    it('tamper detection: mutating an entry breaks the chain', () => {
      logger.record(makeInput());
      logger.record(makeInput());
      mutateEntry(1);
      const result = logger.verify();
      expect(result.ok).toBe(false);
      expect(result.brokenAt).toBe(1);
    });
  });
}
