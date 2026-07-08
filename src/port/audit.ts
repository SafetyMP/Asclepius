import { createHash } from 'node:crypto';

/**
 * Audit port — append-only, hash-chained, tamper-evident log (ADR 0009).
 *
 * Each entry's hash incorporates the PREVIOUS entry's hash, forming a chain.
 * Verification walks the chain and recomputes hashes; any tampered link is
 * detected. Append-only is enforced at the adapter (no update/delete API).
 *
 * The pure hashing helpers (`GENESIS_HASH`, `computeHash`, `verifyChain`) live
 * in this port file so adapters import only `@/port` (precedent: `parseScope`
 * in `@/port/auth`). Production compliance uses WORM/SIEM; this demonstrates
 * the integrity property, not a compliance-grade system.
 */

/** Principal fields extracted from `AuthContext` for audit logging (minimized). */
export interface AuditPrincipal {
  readonly sub: string;
  readonly role: string;
  /** JSON-stringified scope strings (not full ParsedScope objects). */
  readonly scopesJson: string;
}

/** A hash-chained audit entry. Optional `resourceType`/`resourceId` are omitted when absent. */
export interface AuditEntry {
  readonly sequence: number;
  readonly timestamp: string;
  readonly principal: AuditPrincipal;
  readonly method: string;
  readonly path: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly status: number;
  readonly prevHash: string;
  readonly hash: string;
}

/** What the middleware passes to `record()`. Hash fields are computed by the adapter. */
export interface AuditInput {
  readonly principal: AuditPrincipal;
  readonly method: string;
  readonly path: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly status: number;
}

/** Result of chain verification. `brokenAt` identifies the first broken sequence. */
export interface AuditVerification {
  readonly ok: boolean;
  readonly totalEntries: number;
  readonly brokenAt?: number;
}

/**
 * Append-only hash-chained audit log.
 *
 * `record` computes the hash chain, persists, returns the stamped entry.
 * `verify` walks the entire chain and reports integrity. No update/delete.
 */
export interface AuditLogger {
  record(input: AuditInput): AuditEntry;
  verify(): AuditVerification;
}

// ─── pure hash-chain helpers ───────────────────────────────────────────────

/** The prevHash of the first entry (64-char sentinel). */
export const GENESIS_HASH: string = '0'.repeat(64);

/**
 * Canonical encoding of an entry's hashable fields, in a FIXED key order.
 * Optional fields are normalized to `''` so the encoding is stable regardless
 * of whether the key is present or absent. Excludes `hash` (the output).
 */
function canonicalEncode(entry: Omit<AuditEntry, 'hash'>): string {
  return JSON.stringify({
    sequence: entry.sequence,
    timestamp: entry.timestamp,
    sub: entry.principal.sub,
    role: entry.principal.role,
    scopesJson: entry.principal.scopesJson,
    method: entry.method,
    path: entry.path,
    resourceType: entry.resourceType ?? '',
    resourceId: entry.resourceId ?? '',
    status: entry.status,
    prevHash: entry.prevHash,
  });
}

/** SHA-256 of `(prevHash + canonical(entry))`. Returns lowercase hex (64 chars). */
export function computeHash(entry: Omit<AuditEntry, 'hash'>): string {
  return createHash('sha256')
    .update(entry.prevHash + canonicalEncode(entry), 'utf-8')
    .digest('hex');
}

/**
 * Walk a hash chain (ordered by sequence) and verify integrity.
 * Checks: (1) the first entry's `prevHash` is the genesis sentinel;
 * (2) every entry's `hash` matches a recomputed `computeHash`;
 * (3) every entry's `prevHash` matches the previous entry's `hash`.
 */
export function verifyChain(entries: readonly AuditEntry[]): AuditVerification {
  if (entries.length === 0) {
    return { ok: true, totalEntries: 0 };
  }
  const first = entries[0];
  if (first === undefined) {
    return { ok: true, totalEntries: 0 };
  }
  if (first.prevHash !== GENESIS_HASH || first.hash !== computeHash(first)) {
    return {
      ok: false,
      totalEntries: entries.length,
      brokenAt: first.sequence,
    };
  }
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    const prev = entries[i - 1];
    if (entry === undefined || prev === undefined) {
      return { ok: false, totalEntries: entries.length, brokenAt: i + 1 };
    }
    if (entry.prevHash !== prev.hash || entry.hash !== computeHash(entry)) {
      return {
        ok: false,
        totalEntries: entries.length,
        brokenAt: entry.sequence,
      };
    }
  }
  return { ok: true, totalEntries: entries.length };
}

export { canonicalEncode };
