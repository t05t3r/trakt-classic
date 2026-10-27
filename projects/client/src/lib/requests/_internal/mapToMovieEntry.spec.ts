import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { MovieHereticResponseMock } from '$mocks/data/summary/movies/heretic/response/MovieHereticResponseMock.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { mapToMovieEntry } from './mapToMovieEntry.ts';

function dayOf(date: Date) {
  return [date.getFullYear(), date.getMonth(), date.getDate()];
}

describe('mapToMovieEntry', () => {
  it('should read the release date as its own day west of UTC', () => {
    setTimeZone('America/New_York');

    const movie = mapToMovieEntry({
      ...MovieHereticResponseMock,
      released: '2022-05-27',
    });

    expect(dayOf(movie.releaseDate)).toEqual([2022, 4, 27]);
    expect(dayOf(movie.airDate)).toEqual([2022, 4, 27]);
    expect(dayOf(movie.effectiveReleaseDate)).toEqual([2022, 4, 27]);
  });

  it('should fall back to the max date when the release date is missing', () => {
    const movie = mapToMovieEntry({
      ...MovieHereticResponseMock,
      released: undefined,
    });

    expect(movie.releaseDate).toEqual(MAX_DATE);
  });

  it('should hand out a copy of the max date, not the shared one', () => {
    const movie = mapToMovieEntry({
      ...MovieHereticResponseMock,
      released: undefined,
    });

    expect(movie.releaseDate).not.toBe(MAX_DATE);
  });
});
