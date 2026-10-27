import { time } from '$lib/utils/timing/time.ts';
import { ActivityHistoryMappedMock } from '$mocks/data/users/mapped/ActivityHistoryMappedMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { ActivityHistoryResponseMock } from '$mocks/data/users/response/ActivityHistoryResponseMock.ts';
import { HISTORY_URL } from '$mocks/data/users/HISTORY_URL.ts';
import { server } from '$mocks/server.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import type { ActivityHistoryResponse } from '@trakt/api';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { activityHistoryQuery } from './activityHistoryQuery.ts';

const EPISODE_WITHOUT_SHOW: ActivityHistoryResponse = {
  id: 3,
  watched_at: '2025-01-31T23:12:41.000Z',
  action: 'watch',
  type: 'episode',
  episode: EpisodeSiloResponseMock,
  show: null,
};

const ROWS_WITHOUT_MEDIA: ActivityHistoryResponse[] = [
  {
    id: 4,
    watched_at: '2025-01-31T23:12:41.000Z',
    action: 'watch',
    type: 'movie',
  },
  {
    id: 5,
    watched_at: '2025-01-31T23:12:41.000Z',
    action: 'watch',
    type: 'episode',
    show: ShowSiloResponseMock,
  },
];

function serve(body: ActivityHistoryResponse[]) {
  server.use(http.get(HISTORY_URL, () => pagedResponse({ body })));
}

function readHistory() {
  return runQuery({
    factory: () =>
      createTestBedInfiniteQuery(
        activityHistoryQuery({ slug: 'me', limit: 10 }),
      ),
    waitFor: (result) => result.isFetched,
    mapper: (result) => result,
  }).then(mapToEntries);
}

describe('activityHistoryQuery', () => {
  it('should query watched episodes and movies', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          activityHistoryQuery({ slug: 'me', limit: 10 }),
        ),
      mapper: mapToEntries,
    });

    expect(result).toEqual(ActivityHistoryMappedMock);
  });

  it('should skip a row without its movie or episode', async () => {
    serve([...ActivityHistoryResponseMock, ...ROWS_WITHOUT_MEDIA]);

    const entries = await readHistory();

    expect(entries?.map(({ id }) => id)).toEqual([1, 2]);
  });

  it('should skip an episode row without its show', async () => {
    serve([...ActivityHistoryResponseMock, EPISODE_WITHOUT_SHOW]);

    const entries = await readHistory();

    expect(entries?.map(({ id }) => id)).toEqual([1, 2]);
  });

  it('should keep its data fresh for 15 minutes', () => {
    expect(activityHistoryQuery({ slug: 'me', limit: 10 }).staleTime).toBe(
      time.minutes(15),
    );
  });
});
