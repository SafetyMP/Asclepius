import type Database from 'better-sqlite3';

/**
 * SQLite schema for the resource repository (ADR 0004).
 *
 * Two tables model the in-memory `Entry { versions[], deleted }` shape:
 * - `resource_entry`: one row per (resourceType, id), owns the soft-delete flag.
 * - `resource_version`: one row per version, owns the stamped JSON snapshot.
 *
 * Idempotent (`CREATE … IF NOT EXISTS`); `initSchema` runs on adapter
 * construction. A versioned `_migrations` table is a future upgrade path.
 */
const DDL = [
  `CREATE TABLE IF NOT EXISTS resource_entry (
     resource_type TEXT NOT NULL,
     resource_id   TEXT NOT NULL,
     deleted       INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (resource_type, resource_id)
   )`,
  `CREATE TABLE IF NOT EXISTS resource_version (
     resource_type TEXT NOT NULL,
     resource_id   TEXT NOT NULL,
     version_id    INTEGER NOT NULL,
     resource_json TEXT NOT NULL,
     last_updated  TEXT NOT NULL,
     PRIMARY KEY (resource_type, resource_id, version_id),
     FOREIGN KEY (resource_type, resource_id) REFERENCES resource_entry (resource_type, resource_id)
   )`,
  // current version of active entries (list)
  `CREATE INDEX IF NOT EXISTS idx_entry_active
     ON resource_entry (resource_type, deleted) WHERE deleted = 0`,
  // version chain newest-first (history)
  `CREATE INDEX IF NOT EXISTS idx_version_history
     ON resource_version (resource_type, resource_id, version_id DESC)`,
];

/** Create the schema if it does not exist. Safe to call multiple times. */
export function initSchema(db: Database.Database): void {
  for (const stmt of DDL) {
    db.exec(stmt);
  }
}
