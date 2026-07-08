import type Database from 'better-sqlite3';
import type {
  AuditEntry,
  AuditInput,
  AuditLogger,
  AuditPrincipal,
  AuditVerification,
} from '@/port/audit';
import { computeHash, GENESIS_HASH, verifyChain } from '@/port/audit';
import { initAuditSchema } from './schema';

/**
 * SQLite-backed `AuditLogger` (ADR 0009). Shares the same `Database` handle as
 * `SqliteResourceRepository` (one file, WAL). Append-only: no UPDATE/DELETE on
 * the audit table (except the test-only tamper hook). Hashing computed in TS
 * (one source of truth in `@/port/audit`), not in SQL.
 */
type Stmt = Database.Statement<unknown[], unknown>;

interface LastRow {
  sequence: number;
  entry_hash: string;
}
interface AuditRow {
  sequence: number;
  timestamp: string;
  principal_sub: string;
  principal_role: string;
  principal_scopes: string;
  method: string;
  path: string;
  resource_type: string;
  resource_id: string;
  status: number;
  prev_hash: string;
  entry_hash: string;
}

function rowToEntry(row: AuditRow): AuditEntry {
  return {
    sequence: row.sequence,
    timestamp: row.timestamp,
    principal: {
      sub: row.principal_sub,
      role: row.principal_role,
      scopesJson: row.principal_scopes,
    } satisfies AuditPrincipal,
    method: row.method,
    path: row.path,
    status: row.status,
    prevHash: row.prev_hash,
    hash: row.entry_hash,
    ...(row.resource_type !== '' ? { resourceType: row.resource_type } : {}),
    ...(row.resource_id !== '' ? { resourceId: row.resource_id } : {}),
  };
}

export class SqliteAuditLogger implements AuditLogger {
  private readonly stmtLastEntry: Stmt;
  private readonly stmtInsert: Stmt;
  private readonly stmtSelectAll: Stmt;
  private readonly stmtTamper: Stmt;

  constructor(db: Database.Database) {
    initAuditSchema(db);
    this.stmtLastEntry = db.prepare(
      'SELECT sequence, entry_hash FROM audit_entry ORDER BY sequence DESC LIMIT 1',
    );
    this.stmtInsert = db.prepare(
      `INSERT INTO audit_entry
        (sequence, timestamp, principal_sub, principal_role, principal_scopes,
         method, path, resource_type, resource_id, status, prev_hash, entry_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    this.stmtSelectAll = db.prepare('SELECT * FROM audit_entry ORDER BY sequence ASC');
    this.stmtTamper = db.prepare("UPDATE audit_entry SET method = 'TAMPERED' WHERE sequence = ?");
  }

  record(input: AuditInput): AuditEntry {
    const last = this.stmtLastEntry.get() as LastRow | undefined;
    const prevHash = last?.entry_hash ?? GENESIS_HASH;
    const nextSeq = (last?.sequence ?? 0) + 1;

    const partial: Omit<AuditEntry, 'hash'> = {
      sequence: nextSeq,
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

    this.stmtInsert.run(
      entry.sequence,
      entry.timestamp,
      entry.principal.sub,
      entry.principal.role,
      entry.principal.scopesJson,
      entry.method,
      entry.path,
      entry.resourceType ?? '',
      entry.resourceId ?? '',
      entry.status,
      entry.prevHash,
      entry.hash,
    );
    return entry;
  }

  verify(): AuditVerification {
    const rows = this.stmtSelectAll.all() as AuditRow[];
    return verifyChain(rows.map(rowToEntry));
  }

  /** @internal test-only: mutate an entry's method for tamper-evidence testing. */
  __mutateForTamperTest(sequence: number): void {
    this.stmtTamper.run(sequence);
  }
}
