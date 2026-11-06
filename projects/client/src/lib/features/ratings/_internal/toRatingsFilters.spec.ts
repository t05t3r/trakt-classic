import { describe, expect, it } from 'vitest';
import { toRatingsFilters } from './toRatingsFilters.ts';

describe('util: toRatingsFilters', () => {
  it('should read the bare path as all types and all ratings', () => {
    expect(toRatingsFilters('')).toEqual({ type: 'all', rating: 'all' });
  });

  it.each(['movies', 'shows', 'seasons', 'episodes'])(
    'should read %s as its type',
    (type) => {
      expect(toRatingsFilters(`${type}/all`)).toEqual({ type, rating: 'all' });
    },
  );

  it.each(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])(
    'should read %s as its rating',
    (rating) => {
      expect(toRatingsFilters(`all/${rating}`)).toEqual({
        type: 'all',
        rating,
      });
    },
  );

  it('should read the type with no rating segment', () => {
    expect(toRatingsFilters('movies')).toEqual({
      type: 'movies',
      rating: 'all',
    });
  });

  it('should read both slots', () => {
    expect(toRatingsFilters('seasons/10')).toEqual({
      type: 'seasons',
      rating: '10',
    });
  });

  it('should read a sort in the rating slot as all', () => {
    expect(toRatingsFilters('all/added')).toEqual({
      type: 'all',
      rating: 'all',
    });
  });

  it('should ignore the segments after the rating', () => {
    expect(toRatingsFilters('all/8/added/asc')).toEqual({
      type: 'all',
      rating: '8',
    });
  });

  it.each(['films', 'Movies', 'movie', '8'])(
    'should read the unknown type %s as all and keep the rating',
    (type) => {
      expect(toRatingsFilters(`${type}/8`)).toEqual({
        type: 'all',
        rating: '8',
      });
    },
  );

  it.each(['0', '11', '08', '8.5', '-1', 'all'])(
    'should read the rating %s as all and keep the type',
    (rating) => {
      expect(toRatingsFilters(`movies/${rating}`)).toEqual({
        type: 'movies',
        rating: 'all',
      });
    },
  );
});
