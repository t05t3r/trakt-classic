import { FavoritedMoviesMappedMock } from '$mocks/data/users/mapped/FavoritedMoviesMappedMock.ts';
import { FavoritedShowsMappedMock } from '$mocks/data/users/mapped/FavoritedShowsMappedMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, it } from 'vitest';
import { toItemRuntime } from './toItemRuntime.ts';

describe('toItemRuntime', () => {
  it("should read a movie's runtime", () => {
    expect(toItemRuntime(itemOfType('movie'))).toBe(177);
  });

  it("should read a show's total runtime", () => {
    expect(toItemRuntime(itemOfType('show'))).toBe(1576);
  });

  it("should read an episode's runtime", () => {
    expect(toItemRuntime(itemOfType('episode'))).toBe(66);
  });

  it("should read a season's total runtime", () => {
    expect(toItemRuntime(itemOfType('season'))).toBe(545);
  });

  it("should fall back to the show's runtime per episode for a season without a total", () => {
    const season = itemOfType('season');
    const untotalled = {
      ...season,
      entry: {
        ...season.entry,
        season: { ...season.entry.season, totalRuntime: NaN },
      },
    };

    expect(toItemRuntime(untotalled)).toBe(600);
  });

  it('should read 0 for a runtime the mapper left unknown', () => {
    const movie = itemOfType('movie');
    const unknown = { ...movie, entry: { ...movie.entry, runtime: NaN } };

    expect(toItemRuntime(unknown)).toBe(0);
  });

  it("should read a favourite movie's runtime", () => {
    const movie = assertDefined(FavoritedMoviesMappedMock.at(0));

    expect(toItemRuntime(movie)).toBe(111);
  });

  it("should read a favourite show's total runtime", () => {
    const show = assertDefined(FavoritedShowsMappedMock.at(0));

    expect(toItemRuntime(show)).toBe(900);
  });
});
