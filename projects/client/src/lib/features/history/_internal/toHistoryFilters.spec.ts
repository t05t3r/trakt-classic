import { describe, expect, it } from 'vitest';
import { toHistoryFilters } from './toHistoryFilters.ts';

describe('util: toHistoryFilters', () => {
  it.each(['episodes', 'shows', 'movies'])(
    'should read %s as its type',
    (filters) => {
      expect(toHistoryFilters(filters)).toEqual({ type: filters });
    },
  );

  it.each(['', 'all', 'seasons', 'plays', 'Movies'])(
    'should read "%s" as all',
    (filters) => {
      expect(toHistoryFilters(filters)).toEqual({ type: 'all' });
    },
  );

  it('should ignore the segments after the type', () => {
    expect(toHistoryFilters('movies/plays')).toEqual({ type: 'movies' });
    expect(toHistoryFilters('shows/added/asc')).toEqual({ type: 'shows' });
  });

  it('should read the type from the first segment only', () => {
    expect(toHistoryFilters('all/movies')).toEqual({ type: 'all' });
  });
});
