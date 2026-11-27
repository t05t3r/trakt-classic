import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  PROGRESS_SORTS,
  type ProgressSortBy,
  type ProgressView,
} from './PROGRESS_SORTS.ts';

const readable = (view: ProgressView) =>
  PROGRESS_SORTS[view].map(({ by, how, label }) => ({
    by,
    how,
    label: label(),
  }));

describe('PROGRESS_SORTS', () => {
  it('should offer the watched sorts in menu order, each at its default direction', () => {
    expect(readable('watched')).toEqual([
      { by: 'added', how: 'asc', label: 'Watched Date' },
      { by: 'title', how: 'asc', label: 'Title' },
      { by: 'released', how: 'desc', label: 'Release Date' },
      { by: 'premiered', how: 'desc', label: 'Premiere Date' },
      { by: 'popularity', how: 'desc', label: 'Popularity' },
      { by: 'episodes', how: 'desc', label: 'Episodes Left' },
      { by: 'time', how: 'desc', label: 'Time Left' },
      { by: 'plays', how: 'desc', label: 'Plays' },
      { by: 'runtime', how: 'desc', label: 'Runtime' },
    ]);
  });

  it('should offer the dropped sorts in menu order, each at its default direction', () => {
    expect(readable('dropped')).toEqual([
      { by: 'added', how: 'asc', label: 'Watched Date' },
      { by: 'title', how: 'asc', label: 'Title' },
      { by: 'hidden', how: 'desc', label: 'Dropped Date' },
    ]);
  });

  it.each(['watched', 'dropped'] as const)(
    'should invert only Watched Date on the %s page',
    (view) => {
      const inverted = PROGRESS_SORTS[view]
        .filter((sort) => 'inverted' in sort)
        .map(({ by }) => by);

      expect(inverted).toEqual(['added']);
    },
  );

  it('should type each view by its keys and its sorts', () => {
    expectTypeOf<ProgressView>().toEqualTypeOf<'watched' | 'dropped'>();
    expectTypeOf<ProgressSortBy<'watched'>>().toEqualTypeOf<
      | 'added'
      | 'title'
      | 'released'
      | 'premiered'
      | 'popularity'
      | 'episodes'
      | 'time'
      | 'plays'
      | 'runtime'
    >();
    expectTypeOf<ProgressSortBy<'dropped'>>().toEqualTypeOf<
      'added' | 'title' | 'hidden'
    >();
  });
});
