import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { LikedListItemResponse, ListResponse } from '@trakt/api';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';

type PersonalListsParams = ApiParams & PaginationParams;

// FIXME: add support for non 'me' users
const likedListsRequest = (
  { fetch, page, limit }: PersonalListsParams,
) =>
  api({ fetch })
    .users
    .likes({
      params: { id: 'me', type: 'lists' },
      query: {
        extended: 'full,images',
        page,
        limit,
      },
    });

export const likedListsQuery = defineInfiniteQuery({
  key: 'likedLists',
  invalidations: [InvalidateAction.List.Like],
  dependencies: (params) => [params.page, params.limit],
  request: likedListsRequest,
  mapper: (response) => ({
    entries: response.body
      .filter((entry): entry is LikedListItemResponse => entry.type === 'list')
      .map((entry) => mapToMediaListSummary(entry.list as ListResponse)),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(MediaListSummarySchema),
  ttl: time.minutes(30),
});
