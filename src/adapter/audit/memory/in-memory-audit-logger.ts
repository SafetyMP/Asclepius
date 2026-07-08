import type { AuditEntry, AuditInput, AuditLogger, AuditVerification } from '@/port/audit';
import { computeHash, GENESIS_HASH, verifyChain } from '@/port/audit';

/**
 * In-memory `AuditLogger` — array-based, append-only. No update/delete API.
 * The test-only `__mutateEntry`/`__getAllEntries` hooks exist for the
 * tamper-evidence conformance test and the HTTP integration test.
 */
export class InMemoryAuditLogger implements AuditLogger {
  private readonly entries: AuditEntry[] = [];
  private nextSequence = 1;

  record(input: AuditInput): AuditEntry {
    const prevHash = this.entries.at(-1)?.hash ?? GENESIS_HASH;
    const partial: Omit<AuditEntry, 'hash'> = {
      sequence: this.nextSequence,
      timestamp: new Date().toISOString(),
      principal: input.principal,
      method: input.method,
      path: input.path,
      status: input.status,
      prevHash,
      ...(input.resourceType !== undefined ? { resourceType: input.resourceType } : {}),
      ...(input.resourceId !== undefined ? { resourceId: input.resourceId } : {}),
    };
    const entry: AuditEntry = { ...partial, hash: computeHash(partial) };
    this.entries.push(entry);
    this.nextSequence += 1;
    return entry;
  }

  verify(): AuditVerification {
    return verifyChain(this.entries);
  }

  /** @internal test-only: mutate an entry for tamper-evidence testing. */
  __mutateEntry(sequence: number, mutate: (entry: AuditEntry) => AuditEntry): void {
    const idx = this.entries.findIndex((e) => e.sequence === sequence);
    if (idx >= 0) {
      const found = this.entries[idx];
      if (found) this.entries[idx] = mutate(found);
    }
  }

  /** @internal test-only: read all entries (for integration assertions). */
  __getAllEntries(): readonly AuditEntry[] {
    return this.entries;
  }
}
