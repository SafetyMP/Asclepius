import { randomUUID } from 'node:crypto';
import type { FhirResource, ResourceType } from '@/domain/fhir';
import { deepFreeze } from '@/domain/fhir/deep-freeze';
import { BadRequestError, ConflictError, NotFoundError } from '@/errors';
import type { ResourceRepository, StoredResource } from '@/port/repository';

/**
 * In-memory implementation of ResourceRepository.
 *
 * Storage shape: `Map<resourceType, Map<id, Entry>>` where each Entry holds an
 * immutable version chain (oldest→newest) and a `deleted` flag. Versions are
 * deep-cloned on store and deep-frozen, so they are genuinely immutable
 * snapshots — neither a later update nor an external caller mutating a read
 * result can corrupt history (a correctness requirement for `history` / `vread`).
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
    if (existing?.deleted) {
      // Re-create after delete: continue the version chain rather than discard
      // prior history. FHIR permits id reuse; the new resource becomes the next
      // version so vread of the old versions stays deterministic and history is
      // retained (consistent with the documented soft-delete posture).
      const versioned = this.stamp(resource, this.nextVersionId(existing), id);
      existing.versions.push(versioned);
      existing.deleted = false;
      return versioned;
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
    // Guard against an empty chain explicitly (no `!`); update requires a current
    // version to build on.
    this.lastOrThrow(existing, resourceType, id);
    const versioned = this.stamp(resource, this.nextVersionId(existing), id);
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

  /**
   * Stamp id + meta.versionId/lastUpdated onto a resource, returning a frozen
   * StoredResource. Deep-clones the input first so the store owns its data
   * (later caller mutation of the original object cannot affect stored state),
   * then deep-freezes so returned versions are immutable snapshots.
   */
  private stamp(resource: FhirResource, versionId: string, id: string): StoredResource {
    const lastUpdated = new Date().toISOString();
    // structuredClone decouples the stored snapshot from the caller's input
    // object (spread alone is shallow and would share nested arrays/objects).
    const clone = structuredClone(resource) as FhirResource;
    // Justified cast: we enforce the StoredResource invariant (id +
    // meta.versionId + meta.lastUpdated set) right here. Spreading a union
    // resource and overriding id/meta preserves the resource's discriminant.
    const stamped = {
      ...clone,
      id,
      meta: { ...(clone.meta ?? {}), versionId, lastUpdated },
    } as StoredResource;
    return deepFreeze(stamped);
  }

  /**
   * Next numeric versionId for an entry's chain. This adapter stamps numeric
   * versionIds itself, so continuation increments the prior id. Falls back to
   * '1' if (defensively) the chain is empty.
   */
  private nextVersionId(entry: Entry): string {
    const last = entry.versions.at(-1);
    const lastV = last?.meta.versionId ?? '0';
    return String(Number(lastV) + 1);
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
