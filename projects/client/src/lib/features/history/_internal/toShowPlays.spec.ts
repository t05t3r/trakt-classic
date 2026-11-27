import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import { DEVS_WATCHED_PROGRESS } from '$mocks/data/sync/DEVS_WATCHED_PROGRESS.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { LATEST_WATCHED_AT } from '$mocks/data/sync/LATEST_WATCHED_AT.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toShowPlays } from './toShowPlays.ts';

const LATEST = new Date(LATEST_WATCHED_AT);
const EARLIER = new Date('2025-01-30T20:00:00.000Z');

function rowOf(
  show: ShowEntry,
  lastWatchedAt: Date | null,
): WatchedShowProgress {
  return { ...DEVS_WATCHED_PROGRESS, show, lastWatchedAt };
}

describe('toShowPlays', () => {
  it('should give each show an entry, the latest Play first', () => {
    const plays = toShowPlays([
      rowOf(ShowDevsMappedMock, EARLIER),
      rowOf(ShowSiloMappedMock, LATEST),
    ]);

    expect(plays).toEqual([
      {
        type: 'show',
        key: ShowSiloMappedMock.key,
        watchedAt: LATEST,
        show: ShowSiloMappedMock,
      },
      {
        type: 'show',
        key: ShowDevsMappedMock.key,
        watchedAt: EARLIER,
        show: ShowDevsMappedMock,
      },
    ]);
  });

  it('should give a show that comes twice one entry, dated by its latest Play', () => {
    const plays = toShowPlays([
      rowOf(ShowSiloMappedMock, EARLIER),
      rowOf(ShowSiloMappedMock, LATEST),
    ]);

    expect(plays.map(({ watchedAt }) => watchedAt)).toEqual([LATEST]);
  });

  it('should drop a show with no date, since it has no Play', () => {
    const plays = toShowPlays([
      rowOf(ShowDevsMappedMock, null),
      rowOf(ShowSiloMappedMock, LATEST),
    ]);

    expect(plays.map(({ show }) => show)).toEqual([ShowSiloMappedMock]);
  });
});
