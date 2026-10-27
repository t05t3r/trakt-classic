import { describe, expect, it } from 'vitest';
import { normalizeClientPath } from './normalizeClientPath.ts';

describe('normalizeClientPath', () => {
  it('should drop a leading ./', () => {
    expect(normalizeClientPath('./src/lib/a.ts')).toBe('src/lib/a.ts');
  });

  it('should keep a path without a leading ./', () => {
    expect(normalizeClientPath('src/lib/a.ts')).toBe('src/lib/a.ts');
  });

  it('should read . and ./ as the whole tree', () => {
    expect(normalizeClientPath('.')).toBe('');
    expect(normalizeClientPath('./')).toBe('');
  });
});
