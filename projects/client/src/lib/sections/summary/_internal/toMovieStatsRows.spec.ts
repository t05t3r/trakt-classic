import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { MovieHereticPeopleMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticPeopleMappedMock.ts';
import { MovieHereticStudiosMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticStudiosMappedMock.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { toMovieStatsRows } from './toMovieStatsRows.ts';

const HERETIC = {
  movie: MovieHereticMappedMock,
  crew: MovieHereticPeopleMappedMock,
  studios: MovieHereticStudiosMappedMock,
};

function rowOf(key: string, input = HERETIC) {
  return toMovieStatsRows(input).find((row) => row.key === key);
}

describe('toMovieStatsRows', () => {
  it("should list the rows in Classic's order", () => {
    expect(toMovieStatsRows(HERETIC).map((row) => row.label)).toEqual([
      'Released',
      'Runtime',
      'Director',
      'Writers',
      'Country',
      'Languages',
      'Studios',
      'Genres',
    ]);
  });

  it('should mark no row as zoned', () => {
    expect(toMovieStatsRows(HERETIC).filter((row) => row.zoned)).toEqual([]);
  });

  it('should read the release date as a full day', () => {
    expect(rowOf('released')?.values).toEqual([
      { key: 'released', text: '8 November 2024' },
    ]);
  });

  it("should print the release's local day east of UTC", () => {
    setTimeZone('Asia/Tokyo');
    const movie = {
      ...MovieHereticMappedMock,
      releaseDate: new Date(2022, 4, 27),
    };

    expect(rowOf('released', { ...HERETIC, movie })?.values).toEqual([
      { key: 'released', text: '27 May 2022' },
    ]);
  });

  it('should hand the runtime on in minutes', () => {
    expect(rowOf('runtime')?.values).toEqual([{
      key: 'runtime',
      minutes: 111,
    }]);
  });

  it('should list only the crew with the Director job as directors', () => {
    expect(rowOf('director')?.values).toEqual([
      { key: 'scott-beck', text: 'Scott Beck', href: '/people/scott-beck' },
      { key: 'bryan-woods', text: 'Bryan Woods', href: '/people/bryan-woods' },
    ]);
  });

  it("should list the movie's writers", () => {
    expect(rowOf('writers')?.values).toEqual([
      { key: 'scott-beck', text: 'Scott Beck', href: '/people/scott-beck' },
      { key: 'bryan-woods', text: 'Bryan Woods', href: '/people/bryan-woods' },
    ]);
  });

  it('should name the country, the languages and the genres', () => {
    const texts = (key: string) =>
      rowOf(key)?.values.map((value) => 'text' in value && value.text);

    expect(texts('country')).toEqual(['United States']);
    expect(texts('languages')).toEqual(['Danish', 'English']);
    expect(texts('genres')).toEqual(['Horror', 'Thriller']);
  });

  it('should list every studio inline', () => {
    expect(rowOf('studios')?.values).toEqual([
      { key: 'shiny-penny', text: 'Shiny Penny' },
      { key: 'beck-woods', text: 'Beck/Woods' },
      { key: 'a24', text: 'A24' },
      {
        key: 'catchlight-studios-670133a6-7993-41ee-a05a-a806f40a1288',
        text: 'CatchLight Studios',
      },
    ]);
  });

  it('should skip each row whose value is empty', () => {
    const movie = {
      ...MovieHereticMappedMock,
      releaseDate: MAX_DATE,
      runtime: NaN,
      country: undefined,
      languages: [],
      genres: [],
    };
    const crew = {
      ...MovieHereticPeopleMappedMock,
      directors: [],
      writers: [],
    };

    expect(toMovieStatsRows({ movie, crew, studios: [] })).toEqual([]);
  });
});
