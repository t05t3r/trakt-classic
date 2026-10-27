import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import { WatchedShowsMappedMock } from '$mocks/data/users/mapped/WatchedShowsMappedMock.ts';
import { WatchedShowsMinimalResponseMock } from '$mocks/data/users/response/WatchedShowsMinimalResponseMock.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { serveHeaderlessPages } from '$test/beds/request/serveHeaderlessPages.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it, onTestFinished } from 'vitest';
import {
  currentUserWatchedShowsQuery,
  mapWatchedShowResponse,
} from './currentUserWatchedShowsQuery.ts';

const SHOW_COUNT = Object.keys(WatchedShowsMinimalResponseMock).length;

function readAllPages(limit: number) {
  return captureRequests(async () => {
    const { shows, waitForLateRequests } = await renderStore(() => ({
      shows: useSnapshot(currentUserWatchedShowsQuery({ limit }), {
        select: (entries) => entries,
        whileUnsettled: 'hold',
      }),
      waitForLateRequests: useWaitForLateRequests(),
    }));
    const subscription = shows.subscribe();
    onTestFinished(() => subscription.unsubscribe());

    await readKnown(shows);
    await waitForLateRequests();
  }).then((requests) =>
    requests.filter((request) => request.endsWith('/watched/shows'))
  );
}

describe('currentUserWatchedShowsQuery', () => {
  it('should request 250 watched shows by default', async () => {
    const searches = recordSearches(WATCHED_SHOWS_URL, {});

    await runQuery({
      factory: () => createTestBedInfiniteQuery(currentUserWatchedShowsQuery()),
      mapper: mapToEntries,
    });

    expect(searches.map((search) => search.get('limit')))
      .to.deep.equal(['250']);
  });

  it('should query for watched shows', async () => {
    const result = await runQuery({
      factory: () => createTestBedInfiniteQuery(currentUserWatchedShowsQuery()),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(WatchedShowsMappedMock);
  });

  // Trakt sends this endpoint's pages without pagination headers.
  it('should send one request when a headerless page is shorter than its limit', async () => {
    serveHeaderlessPages({
      url: WATCHED_SHOWS_URL,
      pages: [WatchedShowsMinimalResponseMock, WatchedShowsMinimalResponseMock],
    });

    const requests = await readAllPages(SHOW_COUNT + 1);

    expect(requests).toEqual(['GET /users/me/watched/shows']);
  });

  it('should request the next page when a headerless page fills its limit', async () => {
    serveHeaderlessPages({
      url: WATCHED_SHOWS_URL,
      pages: [
        WatchedShowsMinimalResponseMock,
        { '1390': { '1|1': { '1': ['2024-12-21T20:00:00.000Z'] } } },
      ],
    });

    const requests = await readAllPages(SHOW_COUNT);

    expect(requests).toEqual([
      'GET /users/me/watched/shows',
      'GET /users/me/watched/shows',
    ]);
  });
});

describe('mapWatchedShowResponse', () => {
  it('should include every rewatch date, not just the most recent play per episode', () => {
    const result = mapWatchedShowResponse([
      '147971',
      {
        '1|1': {
          '1': [
            '2024-01-05T20:00:00.000Z',
            '2024-02-20T20:00:00.000Z',
            '2024-03-15T20:00:00.000Z',
          ],
        },
      },
    ]);

    expect(result.watchedDates).to.deep.equal([
      new Date('2024-01-05T20:00:00.000Z'),
      new Date('2024-02-20T20:00:00.000Z'),
      new Date('2024-03-15T20:00:00.000Z'),
    ]);
  });

  it('should still expose only the most recent play as the episode watchedAt', () => {
    const result = mapWatchedShowResponse([
      '147971',
      {
        '1|1': {
          '1': [
            '2024-01-05T20:00:00.000Z',
            '2024-03-15T20:00:00.000Z',
          ],
        },
      },
    ]);

    expect(result.episodes).to.deep.equal([
      {
        season: 1,
        episodeId: 1,
        watchedAt: new Date('2024-03-15T20:00:00.000Z'),
        plays: 2,
      },
    ]);
  });

  it('should collect rewatch dates across every season and episode', () => {
    const result = mapWatchedShowResponse([
      '147971',
      {
        '1|1': {
          '1': ['2024-01-05T20:00:00.000Z'],
          '2': [
            '2024-01-06T20:00:00.000Z',
            '2024-02-20T20:00:00.000Z',
          ],
        },
        '2|2': {
          '1': [
            '2024-03-01T20:00:00.000Z',
            '2024-03-15T20:00:00.000Z',
          ],
        },
      },
    ]);

    expect(result.watchedDates).to.deep.equal([
      new Date('2024-01-05T20:00:00.000Z'),
      new Date('2024-01-06T20:00:00.000Z'),
      new Date('2024-02-20T20:00:00.000Z'),
      new Date('2024-03-01T20:00:00.000Z'),
      new Date('2024-03-15T20:00:00.000Z'),
    ]);
  });

  it('should count episodes per season regardless of rewatch count', () => {
    const result = mapWatchedShowResponse([
      '147971',
      {
        '1|1': {
          '1': [
            '2024-01-05T20:00:00.000Z',
            '2024-02-20T20:00:00.000Z',
            '2024-03-15T20:00:00.000Z',
          ],
          '2': ['2024-01-06T20:00:00.000Z'],
        },
        '2|2': {
          '1': ['2024-03-01T20:00:00.000Z'],
        },
      },
    ]);

    expect(result.playsPerSeason).to.deep.equal(new Map([[1, 2], [2, 1]]));
  });

  it('should expose the most recent play across all episodes as watchedAt', () => {
    const result = mapWatchedShowResponse([
      '147971',
      {
        '1|1': {
          '1': [
            '2024-03-15T20:00:00.000Z',
            '2024-01-05T20:00:00.000Z',
          ],
          '2': ['2024-02-20T20:00:00.000Z'],
        },
      },
    ]);

    expect(result.watchedAt).to.deep.equal(
      new Date('2024-03-15T20:00:00.000Z'),
    );
  });
});
