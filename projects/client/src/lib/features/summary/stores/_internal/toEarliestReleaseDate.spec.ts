import { describe, expect, it } from 'vitest';
import { toEarliestReleaseDate } from './toEarliestReleaseDate.ts';

const EARLIER = new Date(2022, 4, 4);
const LATER = new Date(2022, 4, 27);

describe('util: toEarliestReleaseDate', () => {
  it('should take the earliest release when it comes before the release date', () => {
    expect(toEarliestReleaseDate({
      earliestRelease: EARLIER,
      released: LATER,
    })).toBe(EARLIER);
  });

  it('should take the release date when it comes before every release', () => {
    expect(toEarliestReleaseDate({
      earliestRelease: LATER,
      released: EARLIER,
    })).toBe(EARLIER);
  });

  it.each([null, undefined])(
    'should take the release date when the earliest release is %s',
    (earliestRelease) => {
      expect(toEarliestReleaseDate({ earliestRelease, released: LATER }))
        .toBe(LATER);
    },
  );
});
