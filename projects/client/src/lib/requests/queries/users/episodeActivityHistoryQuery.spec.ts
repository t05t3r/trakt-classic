import { time } from '$lib/utils/timing/time.ts';
import { describeMalformedPlayQuery } from '$test/beds/query/describeMalformedPlayQuery.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { HISTORY_EPISODES_URL } from '$mocks/data/users/HISTORY_EPISODES_URL.ts';
import { EpisodeActivityHistoryResponseMock } from '$mocks/data/users/response/EpisodeActivityHistoryResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { EpisodeActivityHistoryMappedMock } from '$mocks/data/users/mapped/EpisodeActivityHistoryMappedMock.ts';
import { episodeActivityHistoryQuery } from './episodeActivityHistoryQuery.ts';

describe('episodeActivityHistoryQuery', () => {
  it('should keep its data fresh for 15 minutes', () => {
    expect(episodeActivityHistoryQuery({ slug: 'me', limit: 10 }).staleTime)
      .toBe(time.minutes(15));
  });

  it('should query watched episodes', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          episodeActivityHistoryQuery({
            slug: 'me',
            startDate: new Date(Date.now() - time.months(1)),
            endDate: new Date(),
            limit: 10,
          }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(EpisodeActivityHistoryMappedMock);
  });
});

describeMalformedPlayQuery({
  name: 'episodeActivityHistoryQuery',
  query: () => episodeActivityHistoryQuery({ slug: 'me', limit: 10 }),
  url: HISTORY_EPISODES_URL,
  response: EpisodeActivityHistoryResponseMock,
});
