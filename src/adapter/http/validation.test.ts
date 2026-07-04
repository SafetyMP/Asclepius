import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from '@/errors';
import {
  isValidId,
  parseForWrite,
  requireFhirContentType,
  requireResourceType,
  requireValidId,
} from './validation';

describe('requireResourceType', () => {
  it('returns a supported type unchanged', () => {
    expect(requireResourceType('Patient')).toBe('Patient');
  });
  it('throws NotFoundError (404) for an unknown type', () => {
    expect(() => requireResourceType('NotAType')).toThrow(NotFoundError);
  });
  it('throws for a missing param', () => {
    expect(() => requireResourceType(undefined)).toThrow(NotFoundError);
  });
});

describe('requireValidId / isValidId', () => {
  it('accepts a valid FHIR id', () => {
    expect(isValidId('pat-1.abc')).toBe(true);
    expect(requireValidId('pat-1')).toBe('pat-1');
  });
  it('rejects reserved/invalid ids with BadRequestError (400)', () => {
    expect(() => requireValidId('_history')).toThrow(BadRequestError); // underscore not allowed
    expect(() => requireValidId('has space')).toThrow(BadRequestError);
    expect(() => requireValidId('')).toThrow(BadRequestError);
    expect(() => requireValidId(undefined)).toThrow(BadRequestError);
  });
});

describe('requireFhirContentType', () => {
  it('accepts application/fhir+json and application/json (+ charset)', () => {
    expect(() => requireFhirContentType('application/fhir+json')).not.toThrow();
    expect(() => requireFhirContentType('application/json')).not.toThrow();
    expect(() => requireFhirContentType('application/fhir+json; charset=utf-8')).not.toThrow();
  });
  it('rejects other types with UnsupportedMediaTypeError (415)', () => {
    expect(() => requireFhirContentType('text/plain')).toThrow(UnsupportedMediaTypeError);
    expect(() => requireFhirContentType(undefined)).toThrow(UnsupportedMediaTypeError);
  });
});

describe('parseForWrite', () => {
  it('parses a valid resource', () => {
    const r = parseForWrite({ resourceType: 'Patient', id: 'p1' });
    expect(r.resourceType).toBe('Patient');
  });
  it('re-throws ZodError on schema violation (→ 422)', () => {
    expect(() => parseForWrite({ resourceType: 'Patient', gender: 'martian' })).toThrow(ZodError);
  });
  it('converts a non-object body to UnprocessableEntityError (422)', () => {
    expect(() => parseForWrite('nope')).toThrow(UnprocessableEntityError);
  });
  it('converts an unsupported resourceType to UnprocessableEntityError (422)', () => {
    expect(() => parseForWrite({ resourceType: 'Bundle' })).toThrow(UnprocessableEntityError);
  });
});
