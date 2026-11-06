import { time } from '$lib/utils/timing/time.ts';
import { describeMalformedPlayQuery } from '$test/beds/query/describeMalformedPlayQuery.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { HISTORY_SHOWS_URL } from '$mocks/data/users/HISTORY_SHOWS_URL.ts';
import { ShowActivityHistoryResponseMock } from '$mocks/data/users/response/ShowActivityHistoryResponseMock.ts';
import { describe, expect, it } from 'vitest';
import { ShowActivityHistoryMappedMock } from '$mocks/data/users/mapped/ShowActivityHistoryMappedMock.ts';
import { showActivityHistoryQuery } from './showActivityHistoryQuery.ts';

describe('showActivityHistoryQuery', () => {
  it('should query watched shows', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          showActivityHistoryQuery({
            slug: 'me',
            startDate: new Date(Date.now() - time.months(1)),
            endDate: new Date(),
            limit: 10,
          }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(ShowActivityHistoryMappedMock);
  });

  it('should keep its data fresh for 15 minutes', () => {
    expect(showActivityHistoryQuery({ slug: 'me', limit: 10 }).staleTime).toBe(
      time.minutes(15),
    );
  });
});

describeMalformedPlayQuery({
  name: 'showActivityHistoryQuery',
  query: () => showActivityHistoryQuery({ slug: 'me', limit: 10 }),
  url: HISTORY_SHOWS_URL,
  response: ShowActivityHistoryResponseMock,
});
