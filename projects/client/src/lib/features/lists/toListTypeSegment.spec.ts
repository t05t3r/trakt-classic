import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toListTypeSegment } from './toListTypeSegment.ts';

type FavoritesType = (typeof LIST_TYPES.favorites)[number];
type WatchlistType = (typeof LIST_TYPES.watchlist)[number];

describe('toListTypeSegment', () => {
  it("should type a favorites' segment as movies, shows or all", () => {
    expectTypeOf((type: FavoritesType | null) => toListTypeSegment(type))
      .returns.toEqualTypeOf<'movies' | 'shows' | 'all'>();
  });

  it("should type a watchlist's segment as any segment or all", () => {
    expectTypeOf((type: WatchlistType | null) => toListTypeSegment(type))
      .returns.toEqualTypeOf<
      'movies' | 'shows' | 'seasons' | 'episodes' | 'all'
    >();
  });

  it.each(
    [
      { type: null, segment: 'all' },
      { type: 'movie', segment: 'movies' },
      { type: 'show', segment: 'shows' },
      { type: 'season', segment: 'seasons' },
      { type: 'episode', segment: 'episodes' },
    ] as const,
  )('should map $type to $segment', ({ type, segment }) => {
    expect(toListTypeSegment(type)).toBe(segment);
  });
});
