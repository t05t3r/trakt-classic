import { LIST_SORT } from '$lib/features/lists/LIST_SORT.ts';
import type { CreateInfiniteQueryOptions } from '$lib/features/query/QueryOptions.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import type { SortDirection } from '$lib/models/SortDirection.ts';
import type { Paginatable } from '$lib/requests/models/Paginatable.ts';
import { LIST_PAGE_SIZE } from '$lib/utils/LIST_PAGE_SIZE.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import type { InfiniteData, QueryKey } from '@tanstack/query-core';
import type { JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';

export type ListReadParams<T extends string> = {
  type?: T;
  sortBy?: SortBy;
  sortHow?: SortDirection;
  genres?: string;
};

type DescribeListReadQueryProps<T extends string, E> = {
  name: string;
  list: string;
  segments: ReadonlyArray<T>;
  query: (params: ListReadParams<T>) => CreateInfiniteQueryOptions<
    Paginatable<E>,
    Error,
    InfiniteData<Paginatable<E>>,
    QueryKey,
    number
  >;
  url: string;
  response: JsonBodyType;
};

export function describeListReadQuery<T extends string, E>({
  name,
  list,
  segments,
  query,
  url,
  response,
}: DescribeListReadQueryProps<T, E>) {
  const readList = (params: ListReadParams<T> = {}) =>
    runQuery({
      factory: () => createTestBedInfiniteQuery(query(params)),
      mapper: mapToEntries,
    });

  const requestList = (params: ListReadParams<T>) =>
    captureRequests(() => readList(params), { pathIncludes: `/${list}/` });

  describe(name, () => {
    it.each(segments)(
      `should ask for the %s of the ${list}`,
      async (type) => {
        expect(await requestList({ type })).toEqual([
          `GET /users/me/${list}/${type}/rank/asc`,
        ]);
      },
    );

    it.each(LIST_SORT.sorts)(
      `should ask for the ${list} by $by $how`,
      async ({ by, how }) => {
        expect(await requestList({ sortBy: by, sortHow: how })).toEqual([
          `GET /users/me/${list}/all/${by}/${how}`,
        ]);
      },
    );

    it('should ask for 120 items with their images', async () => {
      const searches = recordSearches(url, response);

      await readList();

      // Every GET also carries the query's invalidation `marker`.
      expect(searches.map((search) => Object.fromEntries(search))).toEqual([
        expect.objectContaining({
          extended: 'full,images,colors',
          limit: String(LIST_PAGE_SIZE),
          page: '1',
        }),
      ]);
    });

    it('should send the genre filter', async () => {
      const searches = recordSearches(url, response);

      await readList({ genres: 'drama' });

      expect(searches.map((search) => search.get('genres'))).toEqual([
        'drama',
      ]);
    });
  });
}
