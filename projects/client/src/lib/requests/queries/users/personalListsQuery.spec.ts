import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { LISTS_URL } from '$mocks/data/users/LISTS_URL.ts';
import { PersonalListsMappedMock } from '$mocks/data/users/mapped/PersonalListsMappedMock.ts';
import { PersonalListsResponseMock } from '$mocks/data/users/response/PersonalListsResponseMock.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { personalListsQuery } from './personalListsQuery.ts';

describe('personalListsQuery', () => {
  it('should query user lists', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          personalListsQuery({ slug: 'me', limit: 10 }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(PersonalListsMappedMock);
  });

  it('should query user lists with sort params', async () => {
    const searches = recordSearches(LISTS_URL, PersonalListsResponseMock);

    await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          personalListsQuery({
            slug: 'me',
            limit: 10,
            sortBy: 'updated_at',
            sortHow: 'desc',
          }),
        ),
      mapper: mapToEntries,
    });

    const search = searches.at(-1);
    expect(search?.get('sort_by')).to.equal('updated_at');
    expect(search?.get('sort_how')).to.equal('desc');
  });

  it('should refetch when an item is listed', async () => {
    const invalidate = await observeInvalidation(() =>
      useInfiniteQuery(personalListsQuery({ slug: 'me', limit: 10 }))
    );

    const requests = await invalidate(InvalidateAction.Listed);

    expect(requests).toEqual(['GET /users/me/lists']);
  });
});
