import { PROGRESS_SORTS } from '$lib/features/progress/PROGRESS_SORTS.ts';
import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toProgressFilters } from './toProgressFilters.ts';

const [WATCHED_DEFAULT] = PROGRESS_SORTS.watched;
const [DROPPED_DEFAULT] = PROGRESS_SORTS.dropped;
const WATCHED_AT_DEFAULT = {
  view: 'watched',
  sort: { by: WATCHED_DEFAULT.by, how: WATCHED_DEFAULT.how },
};
const DROPPED_AT_DEFAULT = {
  view: 'dropped',
  sort: { by: DROPPED_DEFAULT.by, how: DROPPED_DEFAULT.how },
};

describe('util: toProgressFilters', () => {
  it('should type the filters per view', () => {
    expectTypeOf(toProgressFilters).returns.toEqualTypeOf<ProgressFilters>();
  });

  it.each([
    { filters: 'watched/added/asc', view: 'watched', by: 'added', how: 'asc' },
    {
      filters: 'watched/title/desc',
      view: 'watched',
      by: 'title',
      how: 'desc',
    },
    { filters: 'dropped/title/asc', view: 'dropped', by: 'title', how: 'asc' },
    {
      filters: 'dropped/hidden/desc',
      view: 'dropped',
      by: 'hidden',
      how: 'desc',
    },
    { filters: 'foo/title/asc', view: 'watched', by: 'title', how: 'asc' },
  ])('should read $filters', ({ filters, view, by, how }) => {
    expect(toProgressFilters(filters)).toEqual({ view, sort: { by, how } });
  });

  it.each([
    '',
    'watched',
    'watched/title',
    'watched/title/up',
    'watched/hidden/desc',
    'foo',
  ])(
    'should read %s as the watched view at its default sort',
    (filters) => {
      expect(toProgressFilters(filters)).toEqual(WATCHED_AT_DEFAULT);
    },
  );

  it.each([
    'dropped',
    'dropped/title',
    'dropped/released/asc',
    'dropped/hidden/up',
  ])(
    'should read %s as the dropped view at its default sort',
    (filters) => {
      expect(toProgressFilters(filters)).toEqual(DROPPED_AT_DEFAULT);
    },
  );
});
