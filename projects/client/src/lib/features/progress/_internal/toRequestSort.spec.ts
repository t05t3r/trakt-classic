import type { ProgressSortBy } from '$lib/features/progress/PROGRESS_SORTS.ts';
import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toRequestSort } from './toRequestSort.ts';

describe('toRequestSort', () => {
  it("should type each narrowed view's sort by that view's names", () => {
    expectTypeOf((filters: ProgressFilters<'watched'>) =>
      toRequestSort(filters)
    )
      .returns.toEqualTypeOf<SortParam<ProgressSortBy<'watched'>>>();
    expectTypeOf((filters: ProgressFilters<'dropped'>) =>
      toRequestSort(filters)
    )
      .returns.toEqualTypeOf<SortParam<ProgressSortBy<'dropped'>>>();
  });

  describe('on the watched page', () => {
    it.each(
      [
        { by: 'added', how: 'asc', request: 'desc' },
        { by: 'added', how: 'desc', request: 'asc' },
        { by: 'title', how: 'asc', request: 'asc' },
        { by: 'title', how: 'desc', request: 'desc' },
        { by: 'released', how: 'asc', request: 'asc' },
        { by: 'released', how: 'desc', request: 'desc' },
        { by: 'premiered', how: 'asc', request: 'asc' },
        { by: 'premiered', how: 'desc', request: 'desc' },
        { by: 'popularity', how: 'asc', request: 'asc' },
        { by: 'popularity', how: 'desc', request: 'desc' },
        { by: 'episodes', how: 'asc', request: 'asc' },
        { by: 'episodes', how: 'desc', request: 'desc' },
        { by: 'time', how: 'asc', request: 'asc' },
        { by: 'time', how: 'desc', request: 'desc' },
        { by: 'plays', how: 'asc', request: 'asc' },
        { by: 'plays', how: 'desc', request: 'desc' },
        { by: 'runtime', how: 'asc', request: 'asc' },
        { by: 'runtime', how: 'desc', request: 'desc' },
      ] as const,
    )(
      'should request $by/$how as sort_by $by, sort_how $request',
      ({ by, how, request }) => {
        expect(toRequestSort({ view: 'watched', sort: { by, how } }))
          .toEqual({ by, how: request });
      },
    );
  });

  describe('on the dropped page', () => {
    it.each(
      [
        { by: 'added', how: 'asc', request: 'desc' },
        { by: 'added', how: 'desc', request: 'asc' },
        { by: 'title', how: 'asc', request: 'asc' },
        { by: 'title', how: 'desc', request: 'desc' },
        { by: 'hidden', how: 'asc', request: 'asc' },
        { by: 'hidden', how: 'desc', request: 'desc' },
      ] as const,
    )(
      'should resolve $by/$how to $by, $request',
      ({ by, how, request }) => {
        expect(toRequestSort({ view: 'dropped', sort: { by, how } }))
          .toEqual({ by, how: request });
      },
    );
  });
});
