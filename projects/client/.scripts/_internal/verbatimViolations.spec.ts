import { describe, expect, it } from 'vitest';
import { verbatimViolations } from './verbatimViolations.ts';

describe('verbatimViolations', () => {
  const upstream = new Map([
    ['src/a.ts', 'aaa'],
    ['src/b.ts', 'bbb'],
  ]);

  it('should find no violation when every changed file matches Upstream', () => {
    const changed = new Map([
      ['src/a.ts', 'aaa'],
      ['src/b.ts', 'bbb'],
    ]);

    expect(verbatimViolations({ changed, upstream })).toEqual([]);
  });

  it('should list a changed file whose content differs from Upstream', () => {
    const changed = new Map([
      ['src/a.ts', 'aaa'],
      ['src/b.ts', 'ccc'],
    ]);

    expect(verbatimViolations({ changed, upstream })).toEqual(['src/b.ts']);
  });

  it('should list a changed file Upstream does not have', () => {
    const changed = new Map([['src/new.ts', 'aaa']]);

    expect(verbatimViolations({ changed, upstream })).toEqual(['src/new.ts']);
  });

  it('should find no violation for an empty change list', () => {
    expect(verbatimViolations({ changed: new Map(), upstream })).toEqual([]);
  });
});
