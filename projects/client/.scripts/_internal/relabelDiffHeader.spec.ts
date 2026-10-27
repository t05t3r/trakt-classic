import { describe, expect, it } from 'vitest';
import { relabelDiffHeader } from './relabelDiffHeader.ts';

describe('relabelDiffHeader', () => {
  const dirs = ['/w/up/projects/client', '/w/ours/projects/client'];

  it('should show both sides relative to the client directory', () => {
    const diff = [
      'diff --git a/w/up/projects/client/src/a.ts b/w/ours/projects/client/src/a.ts',
      'index 7898192..6178079 100644',
      '--- a/w/up/projects/client/src/a.ts',
      '+++ b/w/ours/projects/client/src/a.ts',
      '@@ -1 +1 @@',
      '-a',
      '+b',
      '',
    ].join('\n');

    expect(relabelDiffHeader({ diff, dirs })).toBe(
      [
        'diff --git a/src/a.ts b/src/a.ts',
        'index 7898192..6178079 100644',
        '--- a/src/a.ts',
        '+++ b/src/a.ts',
        '@@ -1 +1 @@',
        '-a',
        '+b',
        '',
      ].join('\n'),
    );
  });

  it('should keep /dev/null for a missing side', () => {
    const diff = [
      'diff --git a/w/ours/projects/client/src/n.ts b/w/ours/projects/client/src/n.ts',
      'new file mode 100644',
      'index 0000000..3e75765',
      '--- /dev/null',
      '+++ b/w/ours/projects/client/src/n.ts',
      '@@ -0,0 +1 @@',
      '+new',
      '',
    ].join('\n');

    expect(relabelDiffHeader({ diff, dirs })).toBe(
      [
        'diff --git a/src/n.ts b/src/n.ts',
        'new file mode 100644',
        'index 0000000..3e75765',
        '--- /dev/null',
        '+++ b/src/n.ts',
        '@@ -0,0 +1 @@',
        '+new',
        '',
      ].join('\n'),
    );
  });

  it('should relabel a binary file notice', () => {
    const diff = [
      'diff --git a/w/up/projects/client/src/i.png b/w/ours/projects/client/src/i.png',
      'index bdc955b..8835708 100644',
      'Binary files a/w/up/projects/client/src/i.png and b/w/ours/projects/client/src/i.png differ',
      '',
    ].join('\n');

    expect(relabelDiffHeader({ diff, dirs })).toBe(
      [
        'diff --git a/src/i.png b/src/i.png',
        'index bdc955b..8835708 100644',
        'Binary files a/src/i.png and b/src/i.png differ',
        '',
      ].join('\n'),
    );
  });

  it('should accept directories with a trailing slash', () => {
    const diff = [
      'diff --git a/w/up/projects/client/a.md b/w/ours/projects/client/a.md',
      'index 7898192..6178079 100644',
      '',
    ].join('\n');

    expect(
      relabelDiffHeader({
        diff,
        dirs: ['/w/up/projects/client/', '/w/ours/projects/client/'],
      }),
    ).toBe(
      ['diff --git a/a.md b/a.md', 'index 7898192..6178079 100644', ''].join(
        '\n',
      ),
    );
  });

  it('should leave the hunks as they are', () => {
    const diff = [
      'diff --git a/w/up/projects/client/a.md b/w/ours/projects/client/a.md',
      'index 7898192..6178079 100644',
      '--- a/w/up/projects/client/a.md',
      '+++ b/w/ours/projects/client/a.md',
      '@@ -1 +1 @@',
      '-see a/w/up/projects/client/b.md',
      '+see b/w/ours/projects/client/b.md',
      '',
    ].join('\n');

    expect(relabelDiffHeader({ diff, dirs })).toBe(
      [
        'diff --git a/a.md b/a.md',
        'index 7898192..6178079 100644',
        '--- a/a.md',
        '+++ b/a.md',
        '@@ -1 +1 @@',
        '-see a/w/up/projects/client/b.md',
        '+see b/w/ours/projects/client/b.md',
        '',
      ].join('\n'),
    );
  });
});
