import { describe, expect, it } from 'vitest';
import { parseScope, parseScopes } from './auth';

describe('parseScope', () => {
  it('parses a concrete scope', () => {
    expect(parseScope('system/Patient.read')).toEqual({
      context: 'system',
      resource: 'Patient',
      action: 'read',
    });
  });

  it('parses wildcard resource and action', () => {
    expect(parseScope('system/*.*')).toEqual({
      context: 'system',
      resource: '*',
      action: '*',
    });
  });

  it('parses patient/user contexts and action *', () => {
    expect(parseScope('patient/Observation.*')?.context).toBe('patient');
    expect(parseScope('user/*.write')?.context).toBe('user');
  });

  it('rejects an unsupported resource type', () => {
    expect(parseScope('system/NotAType.read')).toBeUndefined();
  });

  it('rejects malformed scopes', () => {
    expect(parseScope('bogus')).toBeUndefined();
    expect(parseScope('')).toBeUndefined();
    expect(parseScope('system/Patient')).toBeUndefined();
    expect(parseScope('admin/Patient.read')).toBeUndefined();
  });
});

describe('parseScopes', () => {
  it('splits on whitespace and drops malformed entries', () => {
    const parsed = parseScopes('system/*.read user/Patient.write bogus system/NotAType.read');
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.resource).toBe('*');
    expect(parsed[1]?.resource).toBe('Patient');
  });

  it('returns [] for an empty claim', () => {
    expect(parseScopes('')).toHaveLength(0);
  });
});
