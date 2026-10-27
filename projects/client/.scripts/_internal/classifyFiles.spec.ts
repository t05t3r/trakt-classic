import { describe, expect, it } from 'vitest';
import { classifyFiles } from './classifyFiles.ts';

describe('classifyFiles', () => {
  it('should classify a path with the same blob on both sides as identical', () => {
    const result = classifyFiles({
      ours: new Map([['src/a.ts', 'aaa']]),
      upstream: new Map([['src/a.ts', 'aaa']]),
    });

    expect(result).toEqual([{ path: 'src/a.ts', status: 'identical' }]);
  });

  it('should classify a path with different blobs as modified', () => {
    const result = classifyFiles({
      ours: new Map([['src/a.ts', 'aaa']]),
      upstream: new Map([['src/a.ts', 'bbb']]),
    });

    expect(result).toEqual([{ path: 'src/a.ts', status: 'modified' }]);
  });

  it('should classify a path only on our side as ours', () => {
    const result = classifyFiles({
      ours: new Map([['src/a.ts', 'aaa']]),
      upstream: new Map(),
    });

    expect(result).toEqual([{ path: 'src/a.ts', status: 'ours' }]);
  });

  it('should classify a path only on the Upstream side as not-taken', () => {
    const result = classifyFiles({
      ours: new Map(),
      upstream: new Map([['src/a.ts', 'aaa']]),
    });

    expect(result).toEqual([{ path: 'src/a.ts', status: 'not-taken' }]);
  });
});
