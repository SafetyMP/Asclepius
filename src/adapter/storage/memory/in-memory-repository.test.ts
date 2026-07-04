import { beforeEach, describe, expect, it } from 'vitest';
import type { FhirResource, Patient } from '@/domain/fhir';
import { BadRequestError, ConflictError, NotFoundError } from '@/errors';
import { InMemoryResourceRepository } from './in-memory-repository';

/** Minimal valid Patient (all clinical fields optional). */
function patient(id?: string): Patient {
  return { resourceType: 'Patient', ...(id ? { id } : {}) } as Patient;
}

describe('InMemoryResourceRepository — create / read', () => {
  let repo: InMemoryResourceRepository;
  beforeEach(() => {
    repo = new InMemoryResourceRepository();
  });

  it('create assigns an id, version 1, and stamps lastUpdated', () => {
    const created = repo.create(patient());
    expect(created.id).toMatch(/^[A-Za-z0-9-.]{1,64}$/);
    expect(created.meta.versionId).toBe('1');
    expect(created.meta.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('create preserves a client-supplied id', () => {
    const created = repo.create(patient('pat-1'));
    expect(created.id).toBe('pat-1');
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

describe('InMemoryResourceRepository — update / versioning', () => {
  let repo: InMemoryResourceRepository;
  beforeEach(() => {
    repo = new InMemoryResourceRepository();
  });

  it('update creates the next version and increments versionId', () => {
    repo.create(patient('pat-1'));
    const updated = repo.update({ ...patient('pat-1'), gender: 'female' });
    expect(updated.meta.versionId).toBe('2');
    expect(updated.id).toBe('pat-1');
    expect((updated as Patient).gender).toBe('female');
  });

  it('update preserves client-supplied meta and stamps server-managed fields (PUT semantics)', () => {
    // update is a full replace (FHIR PUT): the client sends the entire new
    // resource, including any meta it wants kept. The server stamps only
    // versionId/lastUpdated. Omitting meta.profile would drop it (correct).
    const profile = ['http://example.com/fhir/StructureDefinition/x'];
    repo.create({
      ...patient('pat-1'),
      meta: { profile },
    });
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
    // v1 snapshot must not have been mutated by the update
    expect((v1 as Patient).active).toBeUndefined();
    expect(v1.meta.versionId).toBe('1');
  });
});

describe('InMemoryResourceRepository — history / vread', () => {
  let repo: InMemoryResourceRepository;
  beforeEach(() => {
    repo = new InMemoryResourceRepository();
  });

  it('history returns all versions newest-first', () => {
    repo.create(patient('pat-1'));
    repo.update({ ...patient('pat-1'), active: true });
    repo.update({ ...patient('pat-1'), gender: 'male' });
    const h = repo.history('Patient', 'pat-1');
    expect(h.map((r) => r.meta.versionId)).toEqual(['3', '2', '1']);
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
    const v2 = repo.vread('Patient', 'pat-1', '2');
    expect((v2 as Patient).active).toBe(true);
  });

  it('vread of an unknown versionId throws NotFoundError', () => {
    repo.create(patient('pat-1'));
    expect(() => repo.vread('Patient', 'pat-1', '99')).toThrow(NotFoundError);
  });
});

describe('InMemoryResourceRepository — delete (soft) / list', () => {
  let repo: InMemoryResourceRepository;
  beforeEach(() => {
    repo = new InMemoryResourceRepository();
  });

  it('delete is soft: read hides the resource but history is retained', () => {
    repo.create(patient('pat-1'));
    repo.update({ ...patient('pat-1'), active: true });
    repo.delete('Patient', 'pat-1');
    expect(() => repo.read('Patient', 'pat-1')).toThrow(NotFoundError);
    // history still present
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
    // re-create becomes the NEXT version — it does not reset to v1 (which would
    // discard prior history and make vread('1') ambiguous).
    expect(recreated.meta.versionId).toBe('3');
    expect((recreated as Patient).gender).toBe('male');
    // prior history is retained and old versions stay addressable + unchanged
    expect(repo.history('Patient', 'pat-1').map((r) => r.meta.versionId)).toEqual(['3', '2', '1']);
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

describe('InMemoryResourceRepository — immutability (deep-freeze)', () => {
  let repo: InMemoryResourceRepository;
  beforeEach(() => {
    repo = new InMemoryResourceRepository();
  });

  it('read returns a frozen snapshot: caller mutation cannot corrupt the store', () => {
    repo.create(patient('pat-1'));
    const got = repo.read('Patient', 'pat-1') as unknown as {
      tampered?: boolean;
      id: string;
    };
    expect(Object.isFrozen(got)).toBe(true);
    // ESM is strict-mode: assigning to a frozen object throws.
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
    // mutating the original input after create must not affect the stored copy
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
