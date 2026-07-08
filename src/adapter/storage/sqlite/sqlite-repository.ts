import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { FhirResource, ResourceType } from '@/domain/fhir';
import { deepFreeze } from '@/domain/fhir/deep-freeze';
import { BadRequestError, ConflictError, NotFoundError } from '@/errors';
import type { ResourceRepository, StoredResource } from '@/port/repository';
import { initSchema } from './schema';

/**
 * SQLite-backed `ResourceRepository` (ADR 0004). ACID persistence in a single
 * file via `better-sqlite3`; JSON-column storage. Observably identical to the
 * in-memory adapter (both pass the shared port-conformance suite):
 * - versioned storage (a row per immutable version)
 * - soft delete (a per-entry flag; history is retained)
 * - re-create-after-delete continues the version chain (does not reset to 1)
 * - returned versions are deep-frozen immutable snapshots
 *
 * Search is NOT lowered to SQL here (ADR 0006 future optimization); the
 * executor searches over `list()` unchanged for both adapters.
 */

type Stmt = Database.Statement<unknown[], unknown>;

interface Statements {
  readonly entryState: Stmt; // SELECT deleted FROM resource_entry WHERE type=? AND id=?
  readonly maxVersion: Stmt; // SELECT COALESCE(MAX(version_id),0) AS max_vid ...
  readonly insertEntry: Stmt; // INSERT OR IGNORE INTO resource_entry
  readonly undelete: Stmt; // UPDATE resource_entry SET deleted=0
  readonly softDelete: Stmt; // UPDATE resource_entry SET deleted=1
  readonly insertVersion: Stmt; // INSERT INTO resource_version
  readonly readCurrent: Stmt; // latest version of an active entry
  readonly readVersion: Stmt; // a specific version
  readonly entryExists: Stmt; // SELECT 1 FROM resource_entry
  readonly historyVersions: Stmt; // all versions newest-first
  readonly listCurrent: Stmt; // latest version of every active entry of a type
}

interface DeletedRow {
  deleted: number;
}
interface MaxRow {
  max_vid: number;
}
interface JsonRow {
  resource_json: string;
}

export class SqliteResourceRepository implements ResourceRepository {
  private readonly db: Database.Database;
  private readonly stmts: Statements;

  constructor(db: Database.Database) {
    this.db = db;
    initSchema(db);
    this.stmts = {
      entryState: db.prepare(
        'SELECT deleted FROM resource_entry WHERE resource_type = ? AND resource_id = ?',
      ),
      maxVersion: db.prepare(
        'SELECT COALESCE(MAX(version_id), 0) AS max_vid FROM resource_version WHERE resource_type = ? AND resource_id = ?',
      ),
      insertEntry: db.prepare(
        'INSERT OR IGNORE INTO resource_entry (resource_type, resource_id, deleted) VALUES (?, ?, 0)',
      ),
      undelete: db.prepare(
        'UPDATE resource_entry SET deleted = 0 WHERE resource_type = ? AND resource_id = ?',
      ),
      softDelete: db.prepare(
        'UPDATE resource_entry SET deleted = 1 WHERE resource_type = ? AND resource_id = ?',
      ),
      insertVersion: db.prepare(
        'INSERT INTO resource_version (resource_type, resource_id, version_id, resource_json, last_updated) VALUES (?, ?, ?, ?, ?)',
      ),
      readCurrent: db.prepare(
        `SELECT rv.resource_json AS resource_json
           FROM resource_version rv
           JOIN resource_entry re
             ON re.resource_type = rv.resource_type AND re.resource_id = rv.resource_id
          WHERE rv.resource_type = ? AND rv.resource_id = ? AND re.deleted = 0
          ORDER BY rv.version_id DESC
          LIMIT 1`,
      ),
      readVersion: db.prepare(
        'SELECT resource_json AS resource_json FROM resource_version WHERE resource_type = ? AND resource_id = ? AND CAST(version_id AS TEXT) = ?',
      ),
      entryExists: db.prepare(
        'SELECT 1 AS one FROM resource_entry WHERE resource_type = ? AND resource_id = ?',
      ),
      historyVersions: db.prepare(
        'SELECT resource_json AS resource_json FROM resource_version WHERE resource_type = ? AND resource_id = ? ORDER BY version_id DESC',
      ),
      listCurrent: db.prepare(
        `SELECT rv.resource_json AS resource_json
           FROM resource_version rv
           JOIN resource_entry re
             ON re.resource_type = rv.resource_type AND re.resource_id = rv.resource_id
          WHERE re.resource_type = ? AND re.deleted = 0
            AND rv.version_id = (
              SELECT MAX(rv2.version_id) FROM resource_version rv2
               WHERE rv2.resource_type = rv.resource_type AND rv2.resource_id = rv.resource_id
            )`,
      ),
    };
  }

  create(resource: FhirResource): StoredResource {
    const id = resource.id ?? randomUUID();
    const resourceType = resource.resourceType;
    return this.db.transaction((): StoredResource => {
      const existing = this.stmts.entryState.get(resourceType, id) as DeletedRow | undefined;
      if (existing !== undefined && existing.deleted === 0) {
        throw new ConflictError(`${resourceType}/${id} already exists`);
      }
      const nextVid = this.nextVersionId(resourceType, id);
      // Brand-new entry: insert it. Re-create after delete: clear the flag.
      if (existing === undefined) {
        this.stmts.insertEntry.run(resourceType, id);
      } else {
        this.stmts.undelete.run(resourceType, id);
      }
      const versioned = this.stamp(resource, String(nextVid), id);
      this.stmts.insertVersion.run(
        resourceType,
        id,
        nextVid,
        JSON.stringify(versioned),
        versioned.meta.lastUpdated,
      );
      return versioned;
    })();
  }

  read(resourceType: ResourceType, id: string): StoredResource {
    const row = this.stmts.readCurrent.get(resourceType, id) as JsonRow | undefined;
    if (row === undefined) {
      throw new NotFoundError(`${resourceType}/${id} not found`);
    }
    return this.fromJson(row.resource_json);
  }

  vread(resourceType: ResourceType, id: string, versionId: string): StoredResource {
    // Exact string match (CAST(version_id AS TEXT) = ?) keeps parity with the
    // in-memory adapter's string comparison: '01' must NOT resolve to v1.
    const row = this.stmts.readVersion.get(resourceType, id, versionId) as JsonRow | undefined;
    if (row === undefined) {
      throw new NotFoundError(`${resourceType}/${id}/_history/${versionId} not found`);
    }
    return this.fromJson(row.resource_json);
  }

  update(resource: FhirResource): StoredResource {
    const resourceType = resource.resourceType;
    const id = resource.id;
    if (id === undefined) {
      throw new BadRequestError('update requires a resource id');
    }
    return this.db.transaction((): StoredResource => {
      const existing = this.stmts.entryState.get(resourceType, id) as DeletedRow | undefined;
      if (existing === undefined || existing.deleted === 1) {
        throw new NotFoundError(`${resourceType}/${id} not found`);
      }
      const nextVid = this.nextVersionId(resourceType, id);
      const versioned = this.stamp(resource, String(nextVid), id);
      this.stmts.insertVersion.run(
        resourceType,
        id,
        nextVid,
        JSON.stringify(versioned),
        versioned.meta.lastUpdated,
      );
      return versioned;
    })();
  }

  delete(resourceType: ResourceType, id: string): void {
    this.db.transaction(() => {
      const existing = this.stmts.entryState.get(resourceType, id) as DeletedRow | undefined;
      if (existing === undefined || existing.deleted === 1) {
        throw new NotFoundError(`${resourceType}/${id} not found`);
      }
      this.stmts.softDelete.run(resourceType, id);
    })();
  }

  history(resourceType: ResourceType, id: string): StoredResource[] {
    const exists = this.stmts.entryExists.get(resourceType, id);
    if (exists === undefined) {
      throw new NotFoundError(`${resourceType}/${id} not found`);
    }
    const rows = this.stmts.historyVersions.all(resourceType, id) as JsonRow[];
    return rows.map((r) => this.fromJson(r.resource_json));
  }

  list(resourceType: ResourceType): StoredResource[] {
    const rows = this.stmts.listCurrent.all(resourceType) as JsonRow[];
    return rows.map((r) => this.fromJson(r.resource_json));
  }

  /** Close the underlying database handle (not part of the port). */
  close(): void {
    this.db.close();
  }

  // ── private ───────────────────────────────────────────────────────────────

  private nextVersionId(resourceType: ResourceType, id: string): number {
    const max = this.stmts.maxVersion.get(resourceType, id) as MaxRow | undefined;
    return (max?.max_vid ?? 0) + 1;
  }

  /** Stamp id + meta.versionId/lastUpdated onto a deep-cloned, frozen snapshot. */
  private stamp(resource: FhirResource, versionId: string, id: string): StoredResource {
    const lastUpdated = new Date().toISOString();
    const clone = structuredClone(resource) as FhirResource;
    const stamped = {
      ...clone,
      id,
      meta: { ...(clone.meta ?? {}), versionId, lastUpdated },
    } as StoredResource;
    return deepFreeze(stamped);
  }

  private fromJson(json: string): StoredResource {
    return deepFreeze(JSON.parse(json) as StoredResource);
  }
}
