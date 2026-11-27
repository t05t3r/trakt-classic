import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
import type {
  ProgressListEntry,
  ProgressReading,
} from '$lib/features/progress/ProgressReading.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { PROGRESS_PAGE_SIZE } from '$lib/utils/PROGRESS_PAGE_SIZE.ts';
import { DEVS_WATCHED_PROGRESS } from '$mocks/data/sync/DEVS_WATCHED_PROGRESS.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { DROPPED_AT } from '$mocks/data/users/DROPPED_AT.ts';
import { describe, expect, it } from 'vitest';
import { toProgressReading } from './toProgressReading.ts';

// Devs is 5 of 8 in with 156 minutes left; Silo is complete, 10 of 10.
const DEVS_ROW: ProgressListEntry = DEVS_WATCHED_PROGRESS;
const SILO_ROW: ProgressListEntry = {
  ...DEVS_WATCHED_PROGRESS,
  show: ShowSiloMappedMock,
  total: 10,
  completed: 10,
  remaining: 0,
  minutesLeft: -3,
};

const ready = (data: ReadonlyArray<ProgressListEntry>) =>
  ({ kind: 'ready', data }) as const;

const rowsOf = ({ status }: ProgressReading) =>
  status.kind === 'ready' ? status.data : [];

describe('toProgressReading', () => {
  it.each(
    [
      { kind: 'loading', status: { kind: 'loading' } },
      { kind: 'error', status: { kind: 'error', retry: () => {} } },
    ] as const,
  )(
    'should read $kind with no rows, no count and no sums',
    ({ status }) => {
      const reading = toProgressReading({ status, watched: null, page: 1 });

      expect(reading).toEqual({
        status,
        pages: { current: 1, total: undefined },
        itemCount: undefined,
        cover: undefined,
        entries: undefined,
        stats: undefined,
      });
    },
  );

  it("should read each row with its show's card and the first row's cover, and sum the header", () => {
    const reading = toProgressReading({
      status: ready([DEVS_ROW, SILO_ROW]),
      watched: null,
      page: 1,
    });

    expect(reading).toEqual({
      status: {
        kind: 'ready',
        data: [
          {
            entry: DEVS_ROW,
            card: toMediaCard({ type: 'show', show: DEVS_ROW.show }),
            isFaded: false,
            droppedAt: undefined,
          },
          {
            entry: SILO_ROW,
            card: toMediaCard({ type: 'show', show: SILO_ROW.show }),
            isFaded: false,
            droppedAt: undefined,
          },
        ],
      },
      pages: { current: 1, total: 1 },
      itemCount: 2,
      cover: toListItemCover({ type: 'show', show: DEVS_ROW.show }),
      entries: [DEVS_ROW, SILO_ROW],
      stats: { completed: 15, aired: 18, minutesLeft: 156, shows: 2 },
    });
  });

  it('should read no rows as empty, with zero sums', () => {
    const reading = toProgressReading({
      status: ready([]),
      watched: null,
      page: 1,
    });

    expect(reading.status).toEqual({ kind: 'empty' });
    expect(reading.stats).toEqual({
      completed: 0,
      aired: 0,
      minutesLeft: 0,
      shows: 0,
    });
  });

  it.each(
    [
      { watched: 'fade', faded: [false, true] },
      { watched: 'hide', faded: [false, false] },
      { watched: null, faded: [false, false] },
    ] as const,
  )(
    'should fade the complete rows only under fade, under $watched',
    ({ watched, faded }) => {
      const reading = toProgressReading({
        status: ready([DEVS_ROW, SILO_ROW]),
        watched,
        page: 1,
      });

      expect(rowsOf(reading).map(({ isFaded }) => isFaded)).toEqual(faded);
    },
  );

  it("should carry a dropped row's date on its row", () => {
    const reading = toProgressReading({
      status: ready([{ ...DEVS_ROW, hiddenAt: DROPPED_AT }]),
      watched: null,
      page: 1,
    });

    expect(rowsOf(reading).map(({ droppedAt }) => droppedAt)).toEqual([
      DROPPED_AT,
    ]);
  });

  it('should carry no date on a dropped row whose date is not known', () => {
    const reading = toProgressReading({
      status: ready([{ ...DEVS_ROW, hiddenAt: MAX_DATE }]),
      watched: null,
      page: 1,
    });

    expect(rowsOf(reading).map(({ droppedAt }) => droppedAt)).toEqual([
      undefined,
    ]);
  });

  it('should page the rows and sum the header over every page', () => {
    const rows = Array.from(
      { length: PROGRESS_PAGE_SIZE + 1 },
      (_, index) => ({
        ...DEVS_ROW,
        show: { ...DEVS_ROW.show, id: index + 1 },
      }),
    );

    const reading = toProgressReading({
      status: ready(rows),
      watched: null,
      page: 2,
    });

    expect(rowsOf(reading).map(({ entry }) => entry.show.id)).toEqual([
      PROGRESS_PAGE_SIZE + 1,
    ]);
    expect(reading.pages).toEqual({ current: 2, total: 2 });
    expect(reading.itemCount).toBe(PROGRESS_PAGE_SIZE + 1);
    expect(reading.stats?.shows).toBe(PROGRESS_PAGE_SIZE + 1);
  });
});
