import { describe, expect, it } from 'vitest';
import type { ResourceType } from '@/domain/fhir';
import type { AuthContext, ParsedScope } from '@/port/auth';
import { can, scopeMatches } from './policy';

function principal(scopes: readonly ParsedScope[]): AuthContext {
  return { sub: 's1', role: 'practitioner', scopes };
}

const rt = (t: string): ResourceType => t as ResourceType;

describe('scopeMatches', () => {
  it('wildcard resource and action grant everything', () => {
    const all: ParsedScope = { context: 'system', resource: '*', action: '*' };
    expect(scopeMatches(all, rt('Patient'), 'read')).toBe(true);
    expect(scopeMatches(all, rt('Observation'), 'write')).toBe(true);
  });

  it('exact resource + action matches only that pair', () => {
    const scope: ParsedScope = {
      context: 'system',
      resource: 'Patient',
      action: 'read',
    };
    expect(scopeMatches(scope, rt('Patient'), 'read')).toBe(true);
    expect(scopeMatches(scope, rt('Patient'), 'write')).toBe(false);
    expect(scopeMatches(scope, rt('Observation'), 'read')).toBe(false);
  });

  it('action * covers both read and write', () => {
    const scope: ParsedScope = {
      context: 'system',
      resource: 'Observation',
      action: '*',
    };
    expect(scopeMatches(scope, rt('Observation'), 'read')).toBe(true);
    expect(scopeMatches(scope, rt('Observation'), 'write')).toBe(true);
  });

  it('resource * with a specific action covers any type for that action', () => {
    const scope: ParsedScope = {
      context: 'user',
      resource: '*',
      action: 'read',
    };
    expect(scopeMatches(scope, rt('Patient'), 'read')).toBe(true);
    expect(scopeMatches(scope, rt('Condition'), 'read')).toBe(true);
    expect(scopeMatches(scope, rt('Patient'), 'write')).toBe(false);
  });
});

describe('can', () => {
  it('returns true when any scope grants the pair', () => {
    const ctx = principal([
      { context: 'system', resource: 'Observation', action: 'read' },
      { context: 'system', resource: 'Patient', action: 'write' },
    ]);
    expect(can(ctx, rt('Patient'), 'write')).toBe(true);
    expect(can(ctx, rt('Observation'), 'read')).toBe(true);
    expect(can(ctx, rt('Patient'), 'read')).toBe(false);
  });

  it('returns false for an empty scope set', () => {
    expect(can(principal([]), rt('Patient'), 'read')).toBe(false);
  });

  it('patient context grants read in the MVP (no compartment filtering)', () => {
    const ctx = principal([{ context: 'patient', resource: 'Patient', action: 'read' }]);
    expect(can(ctx, rt('Patient'), 'read')).toBe(true);
  });
});
