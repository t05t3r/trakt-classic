import { LIST_SORT } from '$lib/features/lists/LIST_SORT.ts';
import { describe, expect, it } from 'vitest';
import { isDefaultSort } from './isDefaultSort.ts';

describe('isDefaultSort', () => {
  it('should hold the first sort at its own direction as the default', () => {
    expect(isDefaultSort({ by: 'rank', how: 'asc' }, LIST_SORT.sorts))
      .toBe(true);
  });

  it.each(
    [
      ['another key', { by: 'title', how: 'asc' }],
      ['the first key reversed', { by: 'rank', how: 'desc' }],
      ['another key at its own direction', { by: 'added', how: 'desc' }],
    ] as const,
  )('should not hold %s as the default', (_, sort) => {
    expect(isDefaultSort(sort, LIST_SORT.sorts)).toBe(false);
  });
});
