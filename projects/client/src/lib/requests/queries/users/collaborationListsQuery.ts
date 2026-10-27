import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';

type CollaborationListsParams = { slug: string } & ApiParams;

// FIXME: add pagination support to this endpoint
const collaborationListsRequest = (
  { fetch, slug }: CollaborationListsParams,
) =>
  api({ fetch })
    .users
    .lists
    .collaborations({
      params: {
        id: slug,
      },
      query: {
        extended: 'images',
      },
    });

export const collaborationListsQuery = defineInfiniteQuery({
  key: 'collaborationLists',
  invalidations: [
    InvalidateAction.Listed,
    InvalidateAction.List.Like,
  ],
  dependencies: (params) => [params.slug],
  request: collaborationListsRequest,
  mapper: (response) => ({
    entries: response.body.map(mapToMediaListSummary),
    // The request sends no page, so one response holds every list.
    page: { type: 'paginated', current: 1, total: 1 },
  }),
  schema: PaginatableSchemaFactory(MediaListSummarySchema),
  ttl: time.minutes(30),
});
