import { randomUUID } from 'node:crypto';
import type { FhirResource, ResourceType } from '@/domain/fhir';
import { BadRequestError, ConflictError, NotFoundError } from '@/errors';
import type { ResourceRepository, StoredResource } from '@/port/repository';

/**
 * In-memory implementation of ResourceRepository.
 *
 * Storage shape: `Map<resourceType, Map<id, Entry>>` where each Entry holds an
 * immutable version chain (oldest→newest) and a `deleted` flag. Versions are
 * never mutated once stored — update appends, so prior versions remain exact
 * snapshots (a correctness requirement for `history` / `vread`).
 *
 * This is the default adapter: zero-dependency, fast, used by tests and
 * `npm run dev`. The SQLite adapter (ADR 0004) implements the same port for
 * real persistence.
 */
interface Entry {
  versions: StoredResource[];
  deleted: boolean;
}

export class InMemoryResourceRepository implements ResourceRepository {
  private readonly store = new Map<ResourceType, Map<string, Entry>>();

  create(resource: FhirResource): StoredResource {
    const resourceType = resource.resourceType;
    const id = resource.id ?? this.generateId();
    const existing = this.entry(resourceType, id);
    if (existing && !existing.deleted) {
      throw new ConflictError(`${resourceType}/${id} already exists`);
    }
    const versioned = this.stamp(resource, '1', id);
    this.setEntry(resourceType, id, { versions: [versioned], deleted: false });
    return versioned;
  }

  read(resourceType: ResourceType, id: string): StoredResource {
    const entry = this.requireEntry(resourceType, id);
    if (entry.deleted) {
      throw new NotFoundError(`${resourceType}/${id} not found`);
    }
    return this.lastOrThrow(entry, resourceType, id);
  }

  vread(resourceType: ResourceType, id: string, versionId: string): StoredResource {
    const entry = this.requireEntry(resourceType, id);
    const version = entry.versions.find((v) => v.meta.versionId === versionId);
    if (!version) {
      throw new NotFoundError(`${resourceType}/${id}/_history/${versionId} not found`);
    }
    return version;
  }

  update(resource: FhirResource): StoredResource {
    const resourceType = resource.resourceType;
    const id = resource.id;
    if (!id) {
      throw new BadRequestError('update requires an id; use create for new resources');
    }
    const existing = this.entry(resourceType, id);
    if (!existing || existing.deleted) {
      throw new NotFoundError(`${resourceType}/${id} not found`);
    }
    const current = this.lastOrThrow(existing, resourceType, id);
    const nextVersionId = String(Number(current.meta.versionId) + 1);
    const versioned = this.stamp(resource, nextVersionId, id);
    existing.versions.push(versioned);
    return versioned;
  }

  delete(resourceType: ResourceType, id: string): void {
    const entry = this.requireEntry(resourceType, id);
    if (entry.deleted) {
      throw new NotFoundError(`${resourceType}/${id} already deleted`);
    }
    entry.deleted = true;
  }

  history(resourceType: ResourceType, id: string): StoredResource[] {
    const entry = this.requireEntry(resourceType, id);
    // newest-first to match FHIR history semantics
    return [...entry.versions].reverse();
  }

  list(resourceType: ResourceType): StoredResource[] {
    const byId = this.store.get(resourceType);
    if (!byId) return [];
    const out: StoredResource[] = [];
    for (const entry of byId.values()) {
      if (entry.deleted) continue;
      const current = entry.versions.at(-1);
      if (current) out.push(current);
    }
    return out;
  }

  // ────────────────────────────── helpers ──────────────────────────────

  private generateId(): string {
    // FHIR id allows hyphens; a UUID is 36 chars (≤ 64). Safe + collision-resistant.
    return randomUUID();
  }

  /** Stamp id + meta.versionId/lastUpdated onto a resource, returning a StoredResource. */
  private stamp(resource: FhirResource, versionId: string, id: string): StoredResource {
    const lastUpdated = new Date().toISOString();
    // Justified cast: we enforce the StoredResource invariant (id + meta.versionId
    // + meta.lastUpdated set) right here. Spreading a union resource and
    // overriding id/meta preserves the resource's discriminant and shape.
    return {
      ...resource,
      id,
      meta: { ...(resource.meta ?? {}), versionId, lastUpdated },
    } as StoredResource;
  }

  private entry(resourceType: ResourceType, id: string): Entry | undefined {
    return this.store.get(resourceType)?.get(id);
  }

  private requireEntry(resourceType: ResourceType, id: string): Entry {
    const entry = this.entry(resourceType, id);
    if (!entry) {
      throw new NotFoundError(`${resourceType}/${id} not found`);
    }
    return entry;
  }

  private setEntry(resourceType: ResourceType, id: string, entry: Entry): void {
    let byId = this.store.get(resourceType);
    if (!byId) {
      byId = new Map();
      this.store.set(resourceType, byId);
    }
    byId.set(id, entry);
  }

  /** Last version of an entry, with an explicit empty-chain guard (no `!`). */
  private lastOrThrow(entry: Entry, resourceType: ResourceType, id: string): StoredResource {
    const current = entry.versions.at(-1);
    if (!current) {
      throw new Error(`invariant violation: empty version chain for ${resourceType}/${id}`);
    }
    return current;
  }
}
