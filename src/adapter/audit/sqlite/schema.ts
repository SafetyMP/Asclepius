import type Database from 'better-sqlite3';

/** DDL for the audit table (idempotent). Shares the same DB as resource tables. */
const AUDIT_DDL = [
  `CREATE TABLE IF NOT EXISTS audit_entry (
     sequence          INTEGER PRIMARY KEY AUTOINCREMENT,
     timestamp         TEXT    NOT NULL,
     principal_sub     TEXT    NOT NULL,
     principal_role    TEXT    NOT NULL,
     principal_scopes  TEXT    NOT NULL,
     method            TEXT    NOT NULL,
     path              TEXT    NOT NULL,
     resource_type     TEXT    NOT NULL DEFAULT '',
     resource_id       TEXT    NOT NULL DEFAULT '',
     status            INTEGER NOT NULL,
     prev_hash         TEXT    NOT NULL,
     entry_hash        TEXT    NOT NULL
   )`,
];

export function initAuditSchema(db: Database.Database): void {
  for (const stmt of AUDIT_DDL) {
    db.exec(stmt);
  }
}
