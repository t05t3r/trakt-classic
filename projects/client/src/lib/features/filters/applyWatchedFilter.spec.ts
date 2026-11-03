import { describe, expect, it } from 'vitest';
import { applyWatchedFilter } from './applyWatchedFilter.ts';

type Thing = { name: string; isWatched: boolean };

const BETA = { name: 'Beta', isWatched: true };
const GAMMA = { name: 'Gamma', isWatched: false };
const ALPHA = { name: 'Alpha', isWatched: true };
const THINGS: ReadonlyArray<Thing> = [BETA, GAMMA, ALPHA];

const isWatched = (thing: Thing) => thing.isWatched;

describe('applyWatchedFilter', () => {
  it('should keep every item unfaded without a filter', () => {
    expect(applyWatchedFilter({ items: THINGS, filter: null, isWatched }))
      .toEqual([
        { item: BETA, isFaded: false },
        { item: GAMMA, isFaded: false },
        { item: ALPHA, isFaded: false },
      ]);
  });

  it('should fade the watched items, in their order, under fade', () => {
    expect(applyWatchedFilter({ items: THINGS, filter: 'fade', isWatched }))
      .toEqual([
        { item: BETA, isFaded: true },
        { item: GAMMA, isFaded: false },
        { item: ALPHA, isFaded: true },
      ]);
  });

  it('should drop the watched items under hide', () => {
    expect(applyWatchedFilter({ items: THINGS, filter: 'hide', isWatched }))
      .toEqual([{ item: GAMMA, isFaded: false }]);
  });

  it('should keep no item when hide drops every one', () => {
    expect(
      applyWatchedFilter({ items: [BETA, ALPHA], filter: 'hide', isWatched }),
    ).toEqual([]);
  });
});
