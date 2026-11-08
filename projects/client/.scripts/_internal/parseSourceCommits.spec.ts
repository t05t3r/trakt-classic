import { describe, expect, it } from 'vitest';
import { parseSourceCommits } from './parseSourceCommits.ts';

const OLD = 'a'.repeat(40);
const NEW = 'b'.repeat(40);

describe('parseSourceCommits', () => {
  it('should pair each path with the commit its record names', () => {
    expect(parseSourceCommits(`\0${OLD}\n\nsrc/a.ts\nsrc/b.ts\n`)).toEqual(
      new Map([['src/a.ts', OLD], ['src/b.ts', OLD]]),
    );
  });

  it('should keep the newest record for a path two records touch', () => {
    const log = `\0${NEW}\n\nsrc/a.ts\n\0${OLD}\n\nsrc/a.ts\nsrc/b.ts\n`;

    expect(parseSourceCommits(log)).toEqual(
      new Map([['src/a.ts', NEW], ['src/b.ts', OLD]]),
    );
  });

  it('should skip a commit with no trailer value', () => {
    expect(parseSourceCommits('\0\n\nsrc/a.ts\n')).toEqual(new Map());
  });

  it('should skip a trailer value that is not a full sha', () => {
    expect(
      parseSourceCommits('\0dropped it in 0688ee9\n\nsrc/a.ts\n'),
    ).toEqual(new Map());
  });

  it('should skip a commit with two trailer values', () => {
    expect(
      parseSourceCommits(`\0${OLD},${NEW}\n\nsrc/a.ts\n`),
    ).toEqual(new Map());
  });

  it('should find nothing in empty output', () => {
    expect(parseSourceCommits('')).toEqual(new Map());
  });
});
