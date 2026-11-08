import { describe, expect, it } from 'vitest';
import { overlaySourceBlobs } from './overlaySourceBlobs.ts';

describe('overlaySourceBlobs', () => {
  const pinned = new Map([['src/a.ts', 'pin-a'], ['src/b.ts', 'pin-b']]);
  const atCommit = new Map([
    ['abc', new Map([['src/a.ts', 'new-a'], ['src/c.ts', 'new-c']])],
  ]);

  it('should keep the pinned blob of a path with no recorded commit', () => {
    expect(
      overlaySourceBlobs({ pinned, commits: new Map(), atCommit }),
    ).toEqual(pinned);
  });

  it('should take a recorded path from its commit', () => {
    const commits = new Map([['src/a.ts', 'abc'], ['src/c.ts', 'abc']]);

    expect(overlaySourceBlobs({ pinned, commits, atCommit })).toEqual(
      new Map([
        ['src/b.ts', 'pin-b'],
        ['src/a.ts', 'new-a'],
        ['src/c.ts', 'new-c'],
      ]),
    );
  });

  it('should drop a recorded path its commit does not hold', () => {
    const commits = new Map([['src/b.ts', 'abc']]);

    expect(overlaySourceBlobs({ pinned, commits, atCommit })).toEqual(
      new Map([['src/a.ts', 'pin-a']]),
    );
  });
});
