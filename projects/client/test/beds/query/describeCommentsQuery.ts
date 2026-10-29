import type { CreateInfiniteQueryOptions } from '$lib/features/query/QueryOptions.ts';
import { invalidationId } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import type { Paginatable } from '$lib/requests/models/Paginatable.ts';
import { createTestBedInfiniteQuery } from '$test/beds/query/createTestBedInfiniteQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { mapToEntries } from '$test/utils/mapToEntries.ts';
import type { InfiniteData, QueryKey } from '@tanstack/query-core';
import type { JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';

type CommentPages = Paginatable<MediaComment>;

type DescribeCommentsQueryProps = {
  name: string;
  subject: string;
  query: () => CreateInfiniteQueryOptions<
    CommentPages,
    Error,
    InfiniteData<CommentPages>,
    QueryKey,
    number
  >;
  url: string;
  response: JsonBodyType;
  mapped: ReadonlyArray<MediaComment>;
};

export function describeCommentsQuery({
  name,
  subject,
  query,
  url,
  response,
  mapped,
}: DescribeCommentsQueryProps) {
  const readComments = () =>
    runQuery({
      factory: () => createTestBedInfiniteQuery(query()),
      mapper: mapToEntries,
    });

  describe(name, () => {
    it(`should query for comments on ${subject}`, async () => {
      expect(await readComments()).toEqual(mapped);
    });

    it('should carry no invalidation marker in its key', () => {
      expect(query().queryKey).not.toContainEqual(
        expect.stringContaining(invalidationId()),
      );
    });

    it('should send no marker with its request', async () => {
      const searches = recordSearches(url, response);

      await readComments();

      expect(searches.map((search) => search.has('marker'))).toEqual([false]);
    });
  });
}
