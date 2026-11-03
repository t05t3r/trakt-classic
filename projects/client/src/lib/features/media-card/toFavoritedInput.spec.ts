import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { FavoritedMoviesMappedMock } from '$mocks/data/users/mapped/FavoritedMoviesMappedMock.ts';
import { FavoritedShowsMappedMock } from '$mocks/data/users/mapped/FavoritedShowsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toFavoritedInput } from './toFavoritedInput.ts';

describe('toFavoritedInput', () => {
  it('should read a favourite movie as a movie', () => {
    const movie = assertDefined(FavoritedMoviesMappedMock.at(0));

    expect(toFavoritedInput(movie)).toEqual({
      type: 'movie',
      movie: MovieHereticMappedMock,
    });
  });

  it('should read a favourite show as a show', () => {
    const show = assertDefined(FavoritedShowsMappedMock.at(0));

    expect(toFavoritedInput(show)).toEqual({
      type: 'show',
      show: ShowSiloMappedMock,
    });
  });
});
