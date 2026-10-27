import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ListedMoviesMappedMock } from '$mocks/data/lists/mapped/ListedMoviesMappedMock.ts';
import { ListedShowsMappedMock } from '$mocks/data/lists/mapped/ListedShowsMappedMock.ts';
import { HereticListsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/HereticListsMappedMock.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { UserProfileHarryMappedMock } from '$mocks/data/users/mapped/UserProfileHarryMappedMock.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { describe, expect, it } from 'vitest';
import { userListItemsQuery } from './userListItemsQuery.ts';

const PAGINATION_PARAMS = {
  limit: 10,
};
const HARRY = assertDefined(UserProfileHarryMappedMock.slug);
const SILO_LIST = assertDefined(SiloListsMappedMock.at(0)).slug;

describe('userListItemsQuery', () => {
  it('should query list items', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          userListItemsQuery({
            userId: assertDefined(UserProfileHarryMappedMock.slug),
            listId: assertDefined(SiloListsMappedMock.at(0)).slug,
            ...PAGINATION_PARAMS,
          }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal([
      ...ListedShowsMappedMock,
      ...ListedMoviesMappedMock,
    ]);
  });

  it('should query show list items', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          userListItemsQuery({
            userId: assertDefined(UserProfileHarryMappedMock.slug),
            listId: assertDefined(SiloListsMappedMock.at(0)).slug,
            type: 'show',
            ...PAGINATION_PARAMS,
          }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(ListedShowsMappedMock);
  });

  it('should query movie list items', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedInfiniteQuery(
          userListItemsQuery({
            userId: assertDefined(UserProfileHarryMappedMock.slug),
            listId: assertDefined(HereticListsMappedMock.at(0)).slug,
            type: 'movie',
            ...PAGINATION_PARAMS,
          }),
        ),
      mapper: mapToEntries,
    });

    expect(result).to.deep.equal(ListedMoviesMappedMock);
  });

  it('should refetch when an item is listed', async () => {
    const invalidate = await observeInvalidation(() =>
      useInfiniteQuery(userListItemsQuery({
        userId: HARRY,
        listId: SILO_LIST,
        ...PAGINATION_PARAMS,
      }))
    );

    const requests = await invalidate(InvalidateAction.Listed);

    expect(requests).toEqual([
      `GET /users/${HARRY}/lists/${SILO_LIST}/items/movie,show,season,episode`,
    ]);
  });
});
