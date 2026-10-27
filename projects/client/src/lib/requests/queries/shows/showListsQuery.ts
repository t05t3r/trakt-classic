import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { toListsQuery } from '$lib/requests/_internal/toListsQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { ListsType } from '$lib/requests/models/ListsType.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { time } from '$lib/utils/timing/time.ts';

type ShowListsParams =
  & { slug: string; type: ListsType }
  & ApiParams;

const showListsRequest = ({ fetch, slug, type }: ShowListsParams) =>
  api({ fetch })
    .shows
    .lists({
      params: {
        id: slug,
        type,
        sort: 'popular',
      },
      query: toListsQuery(type),
    });

export const showListsQuery = defineQuery({
  key: 'showLists',
  invalidations: [InvalidateAction.Listed],
  dependencies: (params) => [params.slug, params.type],
  request: showListsRequest,
  mapper: (response) => response.body.map(mapToMediaListSummary),
  schema: MediaListSummarySchema.array(),
  ttl: time.minutes(30),
});
