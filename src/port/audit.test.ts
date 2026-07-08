import { describe, expect, it } from 'vitest';
import { type AuditEntry, computeHash, GENESIS_HASH, verifyChain } from './audit';

function partial(overrides: Partial<Omit<AuditEntry, 'hash'>> = {}): Omit<AuditEntry, 'hash'> {
  return {
    sequence: 1,
    timestamp: '2026-07-08T00:00:00.000Z',
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
    prevHash: GENESIS_HASH,
    ...overrides,
  };
}

function withHash(p: Omit<AuditEntry, 'hash'>): AuditEntry {
  return { ...p, hash: computeHash(p) };
}

describe('computeHash', () => {
  it('is deterministic for the same entry', () => {
    const p = partial();
    expect(computeHash(p)).toBe(computeHash(structuredClone(p)));
  });

  it('produces a 64-char lowercase hex', () => {
    expect(computeHash(partial())).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when any hashable field changes', () => {
    expect(computeHash(partial({ method: 'POST' }))).not.toBe(computeHash(partial()));
    expect(computeHash(partial({ status: 404 }))).not.toBe(computeHash(partial()));
  });
});

describe('verifyChain', () => {
  it('returns ok for an empty chain', () => {
    expect(verifyChain([])).toEqual({ ok: true, totalEntries: 0 });
  });

  it('returns ok for a valid chain', () => {
    const e1 = withHash(partial({ sequence: 1, prevHash: GENESIS_HASH }));
    const e2 = withHash(partial({ sequence: 2, prevHash: e1.hash }));
    expect(verifyChain([e1, e2])).toEqual({ ok: true, totalEntries: 2 });
  });

  it('detects a tampered entry (content mismatch)', () => {
    const e1 = withHash(partial({ sequence: 1 }));
    const e2 = withHash(partial({ sequence: 2, prevHash: e1.hash }));
    // tamper: change e1's method but NOT its hash → content mismatch
    const tampered = { ...e1, method: 'TAMPERED' };
    const result = verifyChain([tampered, e2]);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it('detects a broken link (prevHash mismatch)', () => {
    const e1 = withHash(partial({ sequence: 1 }));
    const e2 = withHash(partial({ sequence: 2, prevHash: e1.hash }));
    // break: set e2's prevHash to a bogus value (and recompute its hash)
    const broken = withHash({ ...e2, prevHash: 'f'.repeat(64) });
    const result = verifyChain([e1, broken]);
    expect(result.ok).toBe(false);
    expect(result.brokenAt).toBe(2);
  });

  it('detects a wrong genesis prevHash on the first entry', () => {
    const e = withHash(partial({ sequence: 1, prevHash: 'f'.repeat(64) }));
    const result = verifyChain([e]);
    expect(result.ok).toBe(false);
  });
});
