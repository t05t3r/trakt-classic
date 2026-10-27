import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { UserStatsMappedMock } from '$mocks/data/users/mapped/UserStatsMappedMock.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { describe, expect, it } from 'vitest';
import { userStatsQuery } from './userStatsQuery.ts';

describe('userStatsQuery', () => {
  it("should query the signed-in user's stats", async () => {
    const result = await runQuery({
      factory: () => createTestBedQuery(userStatsQuery({ slug: 'me' })),
      mapper: (response) => response?.data,
    });

    expect(result).toEqual(UserStatsMappedMock);
  });

  it.each([
    ['a movie', InvalidateAction.MarkAsWatched('movie')],
    ['a show', InvalidateAction.MarkAsWatched('show')],
    ['an episode', InvalidateAction.MarkAsWatched('episode')],
  ])(
    'should refetch when %s is marked watched',
    async (_, action) => {
      const invalidate = await observeInvalidation(() =>
        useQuery(userStatsQuery({ slug: 'me' }))
      );

      const requests = await invalidate(action);

      expect(requests).toEqual(['GET /users/me/stats']);
    },
  );
});
