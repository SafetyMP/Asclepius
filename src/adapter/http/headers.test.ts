import { describe, expect, it } from 'vitest';
import type { StoredResource } from '@/port/repository';
import { contentLocation, createHeaders, etag, lastModified, versionHeaders } from './headers';

function stored(versionId = '3'): StoredResource {
  return {
    resourceType: 'Patient',
    id: 'pat-1',
    meta: { versionId, lastUpdated: '2026-07-04T12:00:00Z' },
  } as StoredResource;
}

describe('header helpers', () => {
  it('etag is a weak validator wrapping the versionId', () => {
    expect(etag(stored('3'))).toBe('W/"3"');
  });

  it('lastModified is an RFC 1123 GMT string', () => {
    expect(lastModified(stored())).toMatch(/GMT$/);
  });

  it('contentLocation points at the versioned resource', () => {
    expect(contentLocation('Patient', 'pat-1', '3')).toBe('Patient/pat-1/_history/3');
  });

  it('versionHeaders has etag + last-modified only', () => {
    expect(Object.keys(versionHeaders(stored())).sort()).toEqual(['etag', 'last-modified']);
  });

  it('createHeaders adds location + content-location', () => {
    const h = createHeaders(stored('2'));
    expect(h.location).toBe('Patient/pat-1');
    expect(h['content-location']).toBe('Patient/pat-1/_history/2');
    expect(h.etag).toBe('W/"2"');
  });
});
