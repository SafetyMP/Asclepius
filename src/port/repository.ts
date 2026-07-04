import type { FhirResource, Meta, ResourceType } from '@/domain/fhir';

/**
 * A resource the repository has stored: a FhirResource whose `id` and
 * `meta.versionId` / `meta.lastUpdated` are guaranteed (create/update stamp
 * them). Callers can rely on these being present without further narrowing.
 */
export type StoredResource = FhirResource & {
  readonly id: string;
  readonly meta: Meta & {
    readonly versionId: string;
    readonly lastUpdated: string;
  };
};

/**
 * The storage port.
 *
 * First principles: FHIR mandates **versioned** storage — every update creates
 * a new immutable version, and the version chain is queryable via `history` /
 * `vread`. Services depend on this interface; adapters (`adapter/storage/memory`
 * now, `adapter/storage/sqlite` later) implement it.
 *
 * Design choices:
 * - `update` requires the resource to exist (throws NotFoundError otherwise).
 *   Create-on-update (FHIR PUT semantics) is orchestrated at the HTTP boundary
 *   (layer 5), keeping each repo operation atomic and predictable.
 * - `delete` is a **soft** delete: history is retained, and `read`/`list` hide
 *   the resource. (A 410-Gone tombstone version is a layer-5 concern.)
 * - **Search is intentionally NOT on this port.** FHIR search is a separate
 *   concern: the search service (layer 3) compiles a query plan that filters
 *   over `list`. Keeping it off the port lets the storage and search concerns
 *   evolve independently (ADR 0006).
 */
export interface ResourceRepository {
  /** Create a new resource at version 1. Assigns an id if none is present. */
  create(resource: FhirResource): StoredResource;
  /** Read the current version. Throws NotFoundError if missing or deleted. */
  read(resourceType: ResourceType, id: string): StoredResource;
  /** Read a specific version by versionId. Throws NotFoundError if absent. */
  vread(resourceType: ResourceType, id: string, versionId: string): StoredResource;
  /**
   * Create the next version of an existing resource. Throws NotFoundError if the
   * id doesn't exist (or was deleted); BadRequestError if no id is present.
   */
  update(resource: FhirResource): StoredResource;
  /** Soft-delete (history retained). Throws NotFoundError if missing/already deleted. */
  delete(resourceType: ResourceType, id: string): void;
  /** All versions, newest-first. Throws NotFoundError if the resource never existed. */
  history(resourceType: ResourceType, id: string): StoredResource[];
  /** Current (non-deleted) version of every resource of a type. */
  list(resourceType: ResourceType): StoredResource[];
}
