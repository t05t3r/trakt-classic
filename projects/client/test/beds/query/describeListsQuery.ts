import type { CreateQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { ListsType } from '$lib/requests/models/ListsType.ts';
import { time } from '$lib/utils/timing/time.ts';
import { OfficialListsMappedMock } from '$mocks/data/lists/mapped/OfficialListsMappedMock.ts';
import { OfficialListsResponseMock } from '$mocks/data/lists/response/OfficialListsResponseMock.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import type { JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';

type DescribeListsQueryProps<T> = {
  name: string;
  subject: string;
  query: (type: ListsType) => CreateQueryOptions<T, Error>;
  personal: { url: string; response: JsonBodyType; mapped: T };
  officialUrl: string;
};

export function describeListsQuery<T>({
  name,
  subject,
  query,
  personal,
  officialUrl,
}: DescribeListsQueryProps<T>) {
  const readLists = (type: ListsType) =>
    runQuery({
      factory: () => createTestBedQuery(query(type)),
      mapper: (response) => response?.data,
    });

  describe(name, () => {
    it(`should query for the popular personal lists that contain ${subject}`, async () => {
      expect(await readLists('personal')).toEqual(personal.mapped);
    });

    it(`should query for the official lists that contain ${subject}`, async () => {
      expect(await readLists('official')).toEqual(OfficialListsMappedMock);
    });

    it('should ask for the first three personal lists with their images', async () => {
      const searches = recordSearches(personal.url, personal.response);

      await readLists('personal');

      // Every GET also carries the query's invalidation `marker`.
      expect(searches.map((search) => Object.fromEntries(search))).toEqual([
        expect.objectContaining({ extended: 'images', limit: '3', page: '1' }),
      ]);
    });

    it('should ask for the first 100 official lists with their images', async () => {
      const searches = recordSearches(officialUrl, OfficialListsResponseMock);

      await readLists('official');

      expect(searches.map((search) => Object.fromEntries(search))).toEqual([
        expect.objectContaining({
          extended: 'images',
          limit: '100',
          page: '1',
        }),
      ]);
    });

    it('should keep its data fresh for 30 minutes', () => {
      expect(query('personal').staleTime).toBe(time.minutes(30));
    });

    it('should refetch when an item is listed', async () => {
      const invalidate = await observeInvalidation(() =>
        useQuery(query('personal'))
      );

      const requests = await invalidate(InvalidateAction.Listed);

      expect(requests).toEqual([`GET ${new URL(personal.url).pathname}`]);
    });

    it('should not refetch when a list is liked', async () => {
      const invalidate = await observeInvalidation(() =>
        useQuery(query('personal'))
      );

      const requests = await invalidate(InvalidateAction.List.Like);

      expect(requests).toEqual([]);
    });
  });
}
