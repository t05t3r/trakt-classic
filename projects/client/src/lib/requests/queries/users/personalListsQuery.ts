import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import type { UserListsSortBy } from '$lib/requests/models/UserListsSortBy.ts';
import type { SortDirection } from '$lib/models/SortDirection.ts';
import { time } from '$lib/utils/timing/time.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';

type PersonalListsParams =
  & {
    slug: string;
    sortBy?: UserListsSortBy | Nil;
    sortHow?: SortDirection | Nil;
  }
  & ApiParams
  & PaginationParams;

const personalListsRequest = (
  { fetch, slug, page, limit, sortBy, sortHow }: PersonalListsParams,
) => {
  const query = {
    extended: 'images' as const,
    page,
    limit,
    sort_by: sortBy,
    sort_how: sortHow,
  };

  return api({ fetch })
    .users
    .lists
    .personal({
      params: {
        id: slug,
      },
      query,
    });
};

export const personalListsQuery = defineInfiniteQuery({
  key: 'personalLists',
  invalidations: [
    InvalidateAction.List.Edited,
    InvalidateAction.List.Deleted,
    InvalidateAction.List.Created,
    InvalidateAction.List.Like,
    InvalidateAction.Listed,
  ],
  dependencies: (params) => [
    params.slug,
    params.page,
    params.limit,
    params.sortBy,
    params.sortHow,
  ],
  request: personalListsRequest,
  mapper: (response) => ({
    entries: response.body.map(mapToMediaListSummary),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(MediaListSummarySchema),
  ttl: time.minutes(30),
});
