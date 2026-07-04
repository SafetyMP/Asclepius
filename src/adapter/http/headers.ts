import type { StoredResource } from '@/port/repository';

/**
 * Pure response-header helpers for a single stored resource.
 *
 * FHIR versioning is exposed via HTTP as:
 * - `ETag: W/"{versionId}"` (weak validator)
 * - `Last-Modified` (RFC 1123, GMT)
 * - `Location` / `Content-Location` on create + update
 * See http://hl7.org/fhir/http.html#versioning.
 */

export function etag(resource: StoredResource): string {
  return `W/"${resource.meta.versionId}"`;
}

/** HTTP `Last-Modified` (RFC 1123, GMT) from `meta.lastUpdated` (an instant). */
export function lastModified(resource: StoredResource): string {
  return new Date(resource.meta.lastUpdated).toUTCString();
}

export function contentLocation(resourceType: string, id: string, versionId: string): string {
  return `${resourceType}/${id}/_history/${versionId}`;
}

/** Headers attached to every resource response (read, vread). */
export function versionHeaders(resource: StoredResource): Record<string, string> {
  return {
    etag: etag(resource),
    'last-modified': lastModified(resource),
  };
}

/** Headers attached to create + update responses (adds Location/Content-Location). */
export function createHeaders(resource: StoredResource): Record<string, string> {
  return {
    ...versionHeaders(resource),
    location: `${resource.resourceType}/${resource.id}`,
    'content-location': contentLocation(
      resource.resourceType,
      resource.id,
      resource.meta.versionId,
    ),
  };
}
