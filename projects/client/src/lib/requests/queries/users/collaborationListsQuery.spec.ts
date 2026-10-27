import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { CollaborationListsMappedMock } from '$mocks/data/users/mapped/CollaborationListsMappedMock.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { collaborationListsQuery } from './collaborationListsQuery.ts';

describe('collaborationListsQuery', () => {
  it('should query list summary', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          collaborationListsQuery({ slug: 'me' }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(CollaborationListsMappedMock);
  });

  it('should report no next page', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          collaborationListsQuery({ slug: 'me' }),
        ),
      waitFor: (query) => query.isSuccess,
    });

    expect(result.hasNextPage).toBe(false);
  });

  it('should refetch when an item is listed', async () => {
    const invalidate = await observeInvalidation(() =>
      useInfiniteQuery(collaborationListsQuery({ slug: 'me' }))
    );

    const requests = await invalidate(InvalidateAction.Listed);

    expect(requests).toEqual(['GET /users/me/lists/collaborations']);
  });
});
