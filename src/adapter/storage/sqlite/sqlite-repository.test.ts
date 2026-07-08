import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, describe, expect, it } from 'vitest';
import { defineRepositoryContract } from '@/../tests/integration/repository-contract';
import { SqliteResourceRepository } from './sqlite-repository';

/** Fresh in-memory DB per test (fast, hermetic, no cleanup). */
function makeMemoryRepo(): SqliteResourceRepository {
  return new SqliteResourceRepository(new Database(':memory:'));
}

// Port-conformance: the SQLite adapter must be observably identical to the
// in-memory adapter (ADR 0004).
defineRepositoryContract('SqliteResourceRepository', makeMemoryRepo);

// SQLite-specific behavior: real persistence + connection lifecycle.
describe('SqliteResourceRepository — persistence', () => {
  const dbPath = join(tmpdir(), `asclepius-test-${process.pid}-${Date.now()}.db`);

  afterAll(() => {
    if (existsSync(dbPath)) unlinkSync(dbPath);
  });

  it('data survives close and reopen (real persistence)', () => {
    const write = new SqliteResourceRepository(new Database(dbPath));
    write.create({ resourceType: 'Patient', id: 'p1', active: true } as never);
    write.update({ resourceType: 'Patient', id: 'p1', active: false } as never);
    write.close();

    const read = new SqliteResourceRepository(new Database(dbPath));
    const got = read.read('Patient', 'p1');
    expect(got.id).toBe('p1');
    expect(got.meta.versionId).toBe('2');
    expect((got as { active: boolean }).active).toBe(false);
    expect(read.history('Patient', 'p1')).toHaveLength(2);
    read.close();
  });
});

describe('SqliteResourceRepository — connection lifecycle', () => {
  it('constructor initializes the schema on a fresh database', () => {
    const db = new Database(':memory:');
    new SqliteResourceRepository(db);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    expect(tables.map((t) => t.name)).toContain('resource_entry');
    expect(tables.map((t) => t.name)).toContain('resource_version');
    db.close();
  });

  it('close() closes the underlying database handle', () => {
    const repo = makeMemoryRepo();
    repo.close();
    // a closed handle throws on further use
    expect(() => repo.read('Patient', 'x')).toThrow();
  });
});
