import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toShowPlays } from './toShowPlays.ts';

const LATEST = new Date('2025-01-31T23:12:41.000Z');
const EARLIER = new Date('2025-01-30T20:00:00.000Z');

describe('toShowPlays', () => {
  it('should give each show an entry, the latest Play first', () => {
    const plays = toShowPlays([
      { show: ShowDevsMappedMock, watchedAt: EARLIER },
      { show: ShowSiloMappedMock, watchedAt: LATEST },
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
      { show: ShowSiloMappedMock, watchedAt: EARLIER },
      { show: ShowSiloMappedMock, watchedAt: LATEST },
    ]);

    expect(plays.map(({ watchedAt }) => watchedAt)).toEqual([LATEST]);
  });
});
