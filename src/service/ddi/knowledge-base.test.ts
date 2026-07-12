import { describe, expect, it } from 'vitest';
import { drugInteractions } from './knowledge-base';

describe('DDI knowledge base', () => {
  it('has at least 5 interaction records', () => {
    expect(drugInteractions.length).toBeGreaterThanOrEqual(5);
  });

  it('all records have valid severity', () => {
    const valid = new Set(['contraindicated', 'major', 'moderate', 'minor']);
    for (const i of drugInteractions) {
      expect(valid.has(i.severity)).toBe(true);
    }
  });

  it('all codes are non-empty', () => {
    for (const i of drugInteractions) {
      expect(i.drugACode.length).toBeGreaterThan(0);
      expect(i.drugBCode.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate pairs', () => {
    const seen = new Set<string>();
    for (const i of drugInteractions) {
      const key =
        i.drugACode < i.drugBCode
          ? `${i.drugACode}|${i.drugBCode}`
          : `${i.drugBCode}|${i.drugACode}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
