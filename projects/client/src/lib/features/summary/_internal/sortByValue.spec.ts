import type { SortDirection } from '$lib/models/SortDirection.ts';
import { describe, expect, it } from 'vitest';
import { sortByValue } from './sortByValue.ts';

type Item = { number: number; score: number | null; votes: number | null };

const ITEMS: ReadonlyArray<Item> = [
  { number: 1, score: 7, votes: 30 },
  { number: 2, score: null, votes: 10 },
  { number: 3, score: 9, votes: null },
  { number: 4, score: 7, votes: 20 },
  { number: 5, score: 0, votes: 10 },
];

function numbersBy(
  { by, how }: { by: 'score' | 'votes'; how: SortDirection },
) {
  return sortByValue({
    items: ITEMS,
    sort: { by, how },
    valueOf: (item, key) => item[key],
  }).map(({ number }) => number);
}

describe('sortByValue', () => {
  it('should put the highest value first and a missing value last', () => {
    expect(numbersBy({ by: 'score', how: 'desc' })).toEqual([3, 4, 1, 5, 2]);
  });

  it('should put the lowest value first and still a missing value last', () => {
    expect(numbersBy({ by: 'score', how: 'asc' })).toEqual([5, 1, 4, 3, 2]);
  });

  it.each(
    [
      { how: 'desc', numbers: [1, 4, 5, 2, 3] },
      { how: 'asc', numbers: [2, 5, 4, 1, 3] },
    ] as const,
  )(
    'should order equal values by number in the sort direction, $how',
    ({ how, numbers }) => {
      expect(numbersBy({ by: 'votes', how })).toEqual(numbers);
    },
  );

  it('should leave the items it was given in their order', () => {
    numbersBy({ by: 'score', how: 'desc' });

    expect(ITEMS.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5]);
  });
});
