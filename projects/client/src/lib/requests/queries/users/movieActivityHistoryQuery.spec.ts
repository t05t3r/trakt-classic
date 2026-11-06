import { time } from '$lib/utils/timing/time.ts';
import { describeMalformedPlayQuery } from '$test/beds/query/describeMalformedPlayQuery.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { HISTORY_MOVIES_URL } from '$mocks/data/users/HISTORY_MOVIES_URL.ts';
import { MovieActivityHistoryResponseMock } from '$mocks/data/users/response/MovieActivityHistoryResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { MovieActivityHistoryMappedMock } from '$mocks/data/users/mapped/MovieActivityHistoryMappedMock.ts';
import { movieActivityHistoryQuery } from './movieActivityHistoryQuery.ts';

describe('movieActivityHistoryQuery', () => {
  it('should query watched movies', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          movieActivityHistoryQuery({
            slug: 'me',
            startDate: new Date(Date.now() - time.months(1)),
            endDate: new Date(),
            limit: 10,
          }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(MovieActivityHistoryMappedMock);
  });

  it('should keep its data fresh for 15 minutes', () => {
    expect(movieActivityHistoryQuery({ slug: 'me', limit: 10 }).staleTime).toBe(
      time.minutes(15),
    );
  });
});

describeMalformedPlayQuery({
  name: 'movieActivityHistoryQuery',
  query: () => movieActivityHistoryQuery({ slug: 'me', limit: 10 }),
  url: HISTORY_MOVIES_URL,
  response: MovieActivityHistoryResponseMock,
});
