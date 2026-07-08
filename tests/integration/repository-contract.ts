import { beforeEach, describe, expect, it } from 'vitest';
import type { FhirResource, Patient } from '@/domain/fhir';
import { BadRequestError, ConflictError, NotFoundError } from '@/errors';
import type { ResourceRepository } from '@/port/repository';

/**
 * Shared `ResourceRepository` port-conformance suite. Both adapters
 * (`InMemoryResourceRepository`, `SqliteResourceRepository`) call this with a
 * factory that returns a fresh repo per test — proving the two implementations
 * are observably identical (the storage seam from ADR 0004 is real, not theater).
 */

/** Minimal valid Patient (all clinical fields optional). */
function patient(id?: string): Patient {
  return { resourceType: 'Patient', ...(id ? { id } : {}) } as Patient;
}

export function defineRepositoryContract(name: string, makeRepo: () => ResourceRepository): void {
  describe(`${name} — create / read`, () => {
    let repo: ResourceRepository;
    beforeEach(() => {
      repo = makeRepo();
    });

    it('create assigns an id, version 1, and stamps lastUpdated', () => {
      const created = repo.create(patient());
      expect(created.id).toMatch(/^[A-Za-z0-9-.]{1,64}$/);
      expect(created.meta.versionId).toBe('1');
      expect(created.meta.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('create preserves a client-supplied id', () => {
      expect(repo.create(patient('pat-1')).id).toBe('pat-1');
    });

    it('create with an existing id throws ConflictError (409)', () => {
      repo.create(patient('pat-1'));
      expect(() => repo.create(patient('pat-1'))).toThrow(ConflictError);
      expect(() => repo.create(patient('pat-1'))).toThrow(/already exists/);
    });

    it('read returns the current version', () => {
      repo.create(patient('pat-1'));
      const got = repo.read('Patient', 'pat-1');
      expect(got.id).toBe('pat-1');
      expect(got.resourceType).toBe('Patient');
    });

    it('read of a missing resource throws NotFoundError (404)', () => {
      expect(() => repo.read('Patient', 'nope')).toThrow(NotFoundError);
    });
  });

  describe(`${name} — update / versioning`, () => {
    let repo: ResourceRepository;
    beforeEach(() => {
      repo = makeRepo();
    });

    it('update creates the next version and increments versionId', () => {
      repo.create(patient('pat-1'));
      const updated = repo.update({ ...patient('pat-1'), gender: 'female' });
      expect(updated.meta.versionId).toBe('2');
      expect(updated.id).toBe('pat-1');
      expect((updated as Patient).gender).toBe('female');
    });

    it('update preserves client-supplied meta and stamps server-managed fields', () => {
      const profile = ['http://example.com/fhir/StructureDefinition/x'];
      repo.create({ ...patient('pat-1'), meta: { profile } });
      const updated = repo.update({
        ...patient('pat-1'),
        meta: { profile },
        active: true,
      });
      expect(updated.meta.profile).toEqual(profile);
      expect(updated.meta.versionId).toBe('2');
      expect(updated.meta.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('update of a missing resource throws NotFoundError', () => {
      expect(() => repo.update(patient('ghost'))).toThrow(NotFoundError);
    });

    it('update without an id throws BadRequestError', () => {
      expect(() => repo.update(patient())).toThrow(BadRequestError);
    });

    it('prior versions remain immutable snapshots', () => {
      repo.create(patient('pat-1'));
      const v1 = repo.read('Patient', 'pat-1');
      repo.update({ ...patient('pat-1'), active: true });
      expect((v1 as Patient).active).toBeUndefined();
      expect(v1.meta.versionId).toBe('1');
    });
  });

  describe(`${name} — history / vread`, () => {
    let repo: ResourceRepository;
    beforeEach(() => {
      repo = makeRepo();
    });

    it('history returns all versions newest-first', () => {
      repo.create(patient('pat-1'));
      repo.update({ ...patient('pat-1'), active: true });
      repo.update({ ...patient('pat-1'), gender: 'male' });
      expect(repo.history('Patient', 'pat-1').map((r) => r.meta.versionId)).toEqual([
        '3',
        '2',
        '1',
      ]);
    });

    it('history of a missing resource throws NotFoundError', () => {
      expect(() => repo.history('Patient', 'ghost')).toThrow(NotFoundError);
    });

    it('vread returns the requested version', () => {
      repo.create(patient('pat-1'));
      repo.update({ ...patient('pat-1'), active: true });
      const v1 = repo.vread('Patient', 'pat-1', '1');
      expect(v1.meta.versionId).toBe('1');
      expect((v1 as Patient).active).toBeUndefined();
      expect((repo.vread('Patient', 'pat-1', '2') as Patient).active).toBe(true);
    });

    it('vread of an unknown versionId throws NotFoundError', () => {
      repo.create(patient('pat-1'));
      expect(() => repo.vread('Patient', 'pat-1', '99')).toThrow(NotFoundError);
    });

    it('vread rejects a non-canonical versionId (parity: string match)', () => {
      repo.create(patient('pat-1'));
      expect(() => repo.vread('Patient', 'pat-1', '01')).toThrow(NotFoundError);
    });
  });

  describe(`${name} — delete (soft) / list`, () => {
    let repo: ResourceRepository;
    beforeEach(() => {
      repo = makeRepo();
    });

    it('delete is soft: read hides the resource but history is retained', () => {
      repo.create(patient('pat-1'));
      repo.update({ ...patient('pat-1'), active: true });
      repo.delete('Patient', 'pat-1');
      expect(() => repo.read('Patient', 'pat-1')).toThrow(NotFoundError);
      expect(repo.history('Patient', 'pat-1').map((r) => r.meta.versionId)).toEqual(['2', '1']);
    });

    it('delete of an already-deleted resource throws NotFoundError', () => {
      repo.create(patient('pat-1'));
      repo.delete('Patient', 'pat-1');
      expect(() => repo.delete('Patient', 'pat-1')).toThrow(NotFoundError);
    });

    it('delete of a missing resource throws NotFoundError', () => {
      expect(() => repo.delete('Patient', 'ghost')).toThrow(NotFoundError);
    });

    it('re-create after delete continues the version chain and retains history', () => {
      repo.create(patient('pat-1')); // v1
      repo.update({ ...patient('pat-1'), active: true }); // v2
      repo.delete('Patient', 'pat-1');
      const recreated = repo.create({ ...patient('pat-1'), gender: 'male' });
      expect(recreated.meta.versionId).toBe('3');
      expect((recreated as Patient).gender).toBe('male');
      expect(repo.history('Patient', 'pat-1').map((r) => r.meta.versionId)).toEqual([
        '3',
        '2',
        '1',
      ]);
      expect((repo.vread('Patient', 'pat-1', '1') as Patient).active).toBeUndefined();
    });

    it('list returns current non-deleted resources of a type', () => {
      repo.create(patient('pat-1'));
      repo.create(patient('pat-2'));
      repo.create(patient('pat-3'));
      repo.delete('Patient', 'pat-2');
      expect(
        repo
          .list('Patient')
          .map((r) => r.id)
          .sort(),
      ).toEqual(['pat-1', 'pat-3']);
    });

    it('list of a type with no resources returns []', () => {
      expect(repo.list('Observation')).toEqual([]);
    });

    it('list is isolated per resource type', () => {
      repo.create(patient('pat-1'));
      repo.create({
        resourceType: 'Condition',
        subject: { reference: 'Patient/pat-1' },
      } as FhirResource);
      expect(repo.list('Patient')).toHaveLength(1);
      expect(repo.list('Condition')).toHaveLength(1);
    });
  });

  describe(`${name} — immutability (deep-freeze)`, () => {
    let repo: ResourceRepository;
    beforeEach(() => {
      repo = makeRepo();
    });

    it('read returns a frozen snapshot: caller mutation cannot corrupt the store', () => {
      repo.create(patient('pat-1'));
      const got = repo.read('Patient', 'pat-1') as unknown as {
        tampered?: boolean;
        id: string;
      };
      expect(Object.isFrozen(got)).toBe(true);
      expect(() => {
        got.tampered = true;
      }).toThrow(TypeError);
      expect(repo.read('Patient', 'pat-1')).not.toHaveProperty('tampered');
    });

    it('prior versions stay immutable snapshots after a later update', () => {
      repo.create(patient('pat-1'));
      const v1 = repo.read('Patient', 'pat-1');
      repo.update({ ...patient('pat-1'), active: true });
      expect(Object.isFrozen(v1)).toBe(true);
      expect((repo.vread('Patient', 'pat-1', '1') as Patient).active).toBeUndefined();
    });

    it('stored snapshots are decoupled from the caller input object', () => {
      const input = { ...patient('pat-1'), active: true } as Patient;
      repo.create(input);
      (input as unknown as { active: boolean }).active = false;
      expect((repo.read('Patient', 'pat-1') as Patient).active).toBe(true);
    });

    it('nested values are frozen too', () => {
      repo.create({
        ...patient('pat-1'),
        name: [{ family: 'Smith', given: ['John'] }],
      });
      const got = repo.read('Patient', 'pat-1') as Patient;
      expect(Object.isFrozen(got.name?.[0])).toBe(true);
      expect(Object.isFrozen(got.name?.[0]?.given)).toBe(true);
    });
  });
}
