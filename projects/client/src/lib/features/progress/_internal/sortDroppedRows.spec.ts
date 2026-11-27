import type { SortParam } from '$lib/features/view-params/stores/useSortParam.ts';
import { describe, expect, it } from 'vitest';
import type { ProgressSortBy } from '../PROGRESS_SORTS.ts';
import { type DroppedRow, sortDroppedRows } from './sortDroppedRows.ts';

type Row = DroppedRow & { id: number };

const ROWS: ReadonlyArray<Row> = [
  {
    id: 1,
    show: { title: 'Silo' },
    lastWatchedAt: new Date('2026-03-01T10:00:00Z'),
    hiddenAt: new Date('2026-06-01T10:00:00Z'),
  },
  {
    id: 2,
    show: { title: 'Andor' },
    lastWatchedAt: null,
    hiddenAt: new Date('2026-07-01T10:00:00Z'),
  },
  {
    id: 3,
    show: { title: 'Devs' },
    lastWatchedAt: new Date('2026-05-01T10:00:00Z'),
    hiddenAt: new Date('2026-04-01T10:00:00Z'),
  },
  {
    id: 4,
    show: { title: 'Severance' },
    lastWatchedAt: new Date('2026-01-01T10:00:00Z'),
    hiddenAt: new Date('2026-05-01T10:00:00Z'),
  },
];

const idsBy = (sort: SortParam<ProgressSortBy<'dropped'>>) =>
  sortDroppedRows({ rows: ROWS, sort }).map(({ id }) => id);

describe('sortDroppedRows', () => {
  it.each(
    [
      { how: 'desc', ids: [3, 1, 4, 2] },
      { how: 'asc', ids: [4, 1, 3, 2] },
    ] as const,
  )(
    'should sort by the last watch, $how, a show never watched last',
    ({ how, ids }) => {
      expect(idsBy({ by: 'added', how })).toEqual(ids);
    },
  );

  it.each(
    [
      { how: 'asc', ids: [2, 3, 4, 1] },
      { how: 'desc', ids: [1, 4, 3, 2] },
    ] as const,
  )('should sort by title, $how', ({ how, ids }) => {
    expect(idsBy({ by: 'title', how })).toEqual(ids);
  });

  it.each(
    [
      { how: 'desc', ids: [2, 1, 4, 3] },
      { how: 'asc', ids: [3, 4, 1, 2] },
    ] as const,
  )('should sort by the date dropped, $how', ({ how, ids }) => {
    expect(idsBy({ by: 'hidden', how })).toEqual(ids);
  });
});
