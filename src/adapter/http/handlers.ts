import type { Context } from 'hono';
import type { FhirResource, ResourceType } from '@/domain/fhir';
import { type BundleLink, historyBundle, searchsetBundle } from '@/domain/fhir';
import { BadRequestError } from '@/errors';
import type { StoredResource } from '@/port/repository';
import type { HttpDeps } from './app';
import { createHeaders, versionHeaders } from './headers';
import { fhirResponse } from './json';
import {
  parseForWrite,
  readJsonObject,
  requireFhirContentType,
  requireResourceType,
  requireValidId,
} from './validation';

/**
 * FHIR REST interaction handlers (Phase 1: CRUD + versioning).
 *
 * Each handler validates the request, calls the `ResourceRepository` port, and
 * returns a shaped Response. Create-on-update (PUT) is orchestrated here at the
 * HTTP boundary (the port's docstring defers it to this layer). All errors
 * throw `FhirError`/`ZodError` and are rendered by `app.onError`.
 */

/** Read without throwing on not-found (returns undefined). Used by PUT. */
function tryRead(deps: HttpDeps, type: ResourceType, id: string): StoredResource | undefined {
  try {
    return deps.repo.read(type, id);
  } catch {
    return undefined;
  }
}

/**
 * Build self/next/previous `Bundle.link` entries for a search result, based on
 * the `_count`/`_page` result operators in the query string. Relative URLs (FHIR
 * clients resolve them against the service base). No next/previous when
 * pagination is off (`_count` absent) or `_count` is 0 (return-no-resources mode).
 */
function paginationLinks(type: string, query: string, total: number): BundleLink[] {
  const params = new URLSearchParams(query);
  const links: BundleLink[] = [{ relation: 'self', url: query ? `${type}?${query}` : type }];
  const count = Number(params.get('_count') ?? Number.NaN);
  if (!Number.isFinite(count) || count <= 0) return links;
  const page = Number(params.get('_page') ?? '1') || 1;
  const lastPage = Math.ceil(total / count);
  if (page < lastPage) {
    params.set('_page', String(page + 1));
    links.push({ relation: 'next', url: `${type}?${params.toString()}` });
  }
  if (page > 1) {
    params.set('_page', String(page - 1));
    links.push({ relation: 'previous', url: `${type}?${params.toString()}` });
  }
  return links;
}

// POST /{Type} — create.
export async function handleCreate(c: Context, deps: HttpDeps): Promise<Response> {
  requireFhirContentType(c.req.header('content-type'));
  const type = requireResourceType(c.req.param('type'));
  const resource = parseForWrite(await readJsonObject(c));
  if (resource.resourceType !== type) {
    throw new BadRequestError(
      `Resource type '${resource.resourceType}' does not match URL type '${type}'`,
    );
  }
  const stored = deps.repo.create(resource);
  return fhirResponse(stored, { status: 201, headers: createHeaders(stored) });
}

// GET /{Type}/{id} — read.
export async function handleRead(c: Context, deps: HttpDeps): Promise<Response> {
  const type = requireResourceType(c.req.param('type'));
  const id = requireValidId(c.req.param('id'));
  const stored = deps.repo.read(type, id);
  return fhirResponse(stored, { headers: versionHeaders(stored) });
}

// GET /{Type}/{id}/_history/{vid} — vread.
export async function handleVread(c: Context, deps: HttpDeps): Promise<Response> {
  const type = requireResourceType(c.req.param('type'));
  const id = requireValidId(c.req.param('id'));
  const vid = requireValidId(c.req.param('vid'));
  const stored = deps.repo.vread(type, id, vid);
  return fhirResponse(stored, { headers: versionHeaders(stored) });
}

// PUT /{Type}/{id} — update, with create-on-update.
export async function handleUpdate(c: Context, deps: HttpDeps): Promise<Response> {
  requireFhirContentType(c.req.header('content-type'));
  const type = requireResourceType(c.req.param('type'));
  const id = requireValidId(c.req.param('id'));
  const resource = parseForWrite(await readJsonObject(c));
  if (resource.resourceType !== type) {
    throw new BadRequestError(
      `Resource type '${resource.resourceType}' does not match URL type '${type}'`,
    );
  }
  if (resource.id !== undefined && resource.id !== id) {
    throw new BadRequestError(`Resource id '${resource.id}' does not match URL id '${id}'`);
  }
  // Create-on-update: PUT to an id that may or may not exist. The resource's id
  // is forced to the path id (FHIR PUT semantics).
  const toStore = { ...resource, id } as FhirResource;
  const existing = tryRead(deps, type, id);
  const stored = existing === undefined ? deps.repo.create(toStore) : deps.repo.update(toStore);
  return fhirResponse(stored, {
    status: existing === undefined ? 201 : 200,
    headers: createHeaders(stored),
  });
}

// DELETE /{Type}/{id} — soft delete (204 No Content).
export async function handleDelete(c: Context, deps: HttpDeps): Promise<Response> {
  const type = requireResourceType(c.req.param('type'));
  const id = requireValidId(c.req.param('id'));
  deps.repo.delete(type, id);
  return new Response(null, { status: 204 });
}

// GET /{Type}/{id}/_history — instance history (all versions of one resource).
export async function handleInstanceHistory(c: Context, deps: HttpDeps): Promise<Response> {
  const type = requireResourceType(c.req.param('type'));
  const id = requireValidId(c.req.param('id'));
  const versions = deps.repo.history(type, id);
  return fhirResponse(historyBundle(versions));
}

// GET /{Type}/_history — type history (version chains of all current resources of a type).
//
// NOTE: the in-memory `list()` excludes soft-deleted resources, so their prior
// versions do not appear here (same root cause as the no-tombstone delete).
export async function handleTypeHistory(c: Context, deps: HttpDeps): Promise<Response> {
  const type = requireResourceType(c.req.param('type'));
  const versions = deps.repo
    .list(type)
    .flatMap((r) => deps.repo.history(type, r.id))
    .sort((a, b) => b.meta.lastUpdated.localeCompare(a.meta.lastUpdated));
  return fhirResponse(historyBundle(versions));
}

// GET /{Type}?{params} — search → searchset Bundle.
export async function handleSearch(c: Context, deps: HttpDeps): Promise<Response> {
  const type = requireResourceType(c.req.param('type'));
  const query = new URL(c.req.url).search.slice(1);
  const result = deps.search(type, query, deps.repo);
  const links = paginationLinks(type, query, result.total);
  return fhirResponse(searchsetBundle([...result.resources], result.total, links));
}

// POST /{Type}/_search — search with application/x-www-form-urlencoded body params.
export async function handleSearchPost(c: Context, deps: HttpDeps): Promise<Response> {
  const type = requireResourceType(c.req.param('type'));
  const query = await c.req.text();
  const result = deps.search(type, query, deps.repo);
  const links = paginationLinks(type, query, result.total);
  return fhirResponse(searchsetBundle([...result.resources], result.total, links));
}
