import { describe, expect, it } from 'vitest';
import { formatStatus } from './formatStatus.ts';

describe('formatStatus', () => {
  const entries = [
    { path: 'src/lib/a.ts', status: 'identical' },
    { path: 'src/lib/b.ts', status: 'modified', lines: 7 },
    { path: 'src/lib/c.ts', status: 'ours' },
    { path: 'src/routes/d.ts', status: 'not-taken' },
    { path: 'static/e.png', status: 'modified', lines: undefined },
  ] as const;

  it('should print the counts per status, then every file', () => {
    expect(formatStatus({ entries })).toBe(
      [
        'identical  1',
        'modified   2',
        'ours       1',
        'not-taken  1',
        '',
        'src/lib/a.ts\tidentical',
        'src/lib/b.ts\tmodified\t7',
        'src/lib/c.ts\tours',
        'src/routes/d.ts\tnot-taken',
        'static/e.png\tmodified\tbinary',
      ].join('\n'),
    );
  });

  it('should count and list only the files under the prefix', () => {
    expect(formatStatus({ entries, prefix: 'src/lib/' })).toBe(
      [
        'identical  1',
        'modified   1',
        'ours       1',
        'not-taken  0',
        '',
        'src/lib/a.ts\tidentical',
        'src/lib/b.ts\tmodified\t7',
        'src/lib/c.ts\tours',
      ].join('\n'),
    );
  });

  it('should read a prefix with a leading ./ as the same prefix', () => {
    expect(formatStatus({ entries, prefix: './src/lib/' })).toBe(
      [
        'identical  1',
        'modified   1',
        'ours       1',
        'not-taken  0',
        '',
        'src/lib/a.ts\tidentical',
        'src/lib/b.ts\tmodified\t7',
        'src/lib/c.ts\tours',
      ].join('\n'),
    );
  });

  it('should read . as the whole tree', () => {
    expect(formatStatus({ entries, prefix: '.' }))
      .toBe(formatStatus({ entries }));
  });

  it('should return nothing when the prefix matches no path', () => {
    expect(formatStatus({ entries, prefix: 'projects/client/src/lib' }))
      .toBeUndefined();
  });

  it('should still print the counts when the status filter lists no path', () => {
    expect(formatStatus({ entries, prefix: 'src/lib/', status: 'not-taken' }))
      .toBe(
        [
          'identical  1',
          'modified   1',
          'ours       1',
          'not-taken  0',
          '',
        ].join('\n'),
      );
  });

  describe('matching whole path segments', () => {
    const siblings = [
      { path: 'src/lib/button/a.ts', status: 'identical' },
      { path: 'src/lib/buttons/b.ts', status: 'ours' },
      { path: 'src/lib/button.ts', status: 'not-taken' },
      { path: 'src/lib/button.tsx', status: 'modified', lines: 3 },
    ] as const;

    it('should match only the directory, with or without a trailing slash', () => {
      const expected = [
        'identical  1',
        'modified   0',
        'ours       0',
        'not-taken  0',
        '',
        'src/lib/button/a.ts\tidentical',
      ].join('\n');

      expect(formatStatus({ entries: siblings, prefix: 'src/lib/button' }))
        .toBe(expected);
      expect(formatStatus({ entries: siblings, prefix: 'src/lib/button/' }))
        .toBe(expected);
    });

    it('should match only the file for a file path', () => {
      expect(formatStatus({ entries: siblings, prefix: 'src/lib/button.ts' }))
        .toBe(
          [
            'identical  0',
            'modified   0',
            'ours       0',
            'not-taken  1',
            '',
            'src/lib/button.ts\tnot-taken',
          ].join('\n'),
        );
    });
  });

  it('should list only the files with the status, keeping every count', () => {
    expect(formatStatus({ entries, prefix: 'src/', status: 'modified' }))
      .toBe(
        [
          'identical  1',
          'modified   1',
          'ours       1',
          'not-taken  1',
          '',
          'src/lib/b.ts\tmodified\t7',
        ].join('\n'),
      );
  });
});
