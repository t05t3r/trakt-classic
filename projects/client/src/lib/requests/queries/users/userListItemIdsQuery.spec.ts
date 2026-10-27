import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { ListItemIdsMappedMock } from '$mocks/data/users/mapped/ListItemIdsMappedMock.ts';
import { server } from '$mocks/server.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { userListItemIdsQuery } from './userListItemIdsQuery.ts';

const LIST = { userId: 'me', listId: 4321 };

describe('userListItemIdsQuery', () => {
  it('should request 250 items of every type without extended info', async () => {
    const requestedUrls: URL[] = [];
    server.use(
      http.get(
        'http://localhost/users/me/lists/4321/items*',
        ({ request }) => {
          requestedUrls.push(new URL(request.url));
          return HttpResponse.json([]);
        },
      ),
    );

    await runQuery({
      factory: () => createTestBedInfiniteQuery(userListItemIdsQuery(LIST)),
      mapper: mapToEntries,
    });

    expect(requestedUrls.map((url) => url.pathname)).toEqual([
      '/users/me/lists/4321/items/movie,show,season,episode',
    ]);
    expect(requestedUrls.map((url) => url.searchParams.get('page')))
      .toEqual(['1']);
    expect(requestedUrls.map((url) => url.searchParams.get('limit')))
      .toEqual(['250']);
    expect(requestedUrls.map((url) => url.searchParams.has('extended')))
      .toEqual([false]);
  });

  it('should map each item to its own type and trakt id', async () => {
    const result = await runQuery({
      factory: () => createTestBedInfiniteQuery(userListItemIdsQuery(LIST)),
      mapper: mapToEntries,
    });

    expect(result).toEqual(ListItemIdsMappedMock);
  });

  it('should refetch when an item is listed in this list', async () => {
    const invalidate = await observeInvalidation(() =>
      createTestBedInfiniteQuery(userListItemIdsQuery(LIST))
    );

    const requests = await invalidate(InvalidateAction.ListedIn(LIST.listId));

    expect(requests).toEqual([
      'GET /users/me/lists/4321/items/movie,show,season,episode',
    ]);
  });

  it('should not refetch when an item is listed in another list', async () => {
    const invalidate = await observeInvalidation(() =>
      createTestBedInfiniteQuery(userListItemIdsQuery(LIST))
    );

    const requests = await invalidate(
      InvalidateAction.ListedIn(6789),
      InvalidateAction.Listed,
    );

    expect(requests).toEqual([]);
  });

  it('should cache each start page apart', () => {
    expect(userListItemIdsQuery({ ...LIST, page: 2 }).queryKey)
      .not.toEqual(userListItemIdsQuery({ ...LIST, page: 1 }).queryKey);
  });
});
