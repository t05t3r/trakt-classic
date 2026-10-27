import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { toListsQuery } from '$lib/requests/_internal/toListsQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { ListsType } from '$lib/requests/models/ListsType.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { time } from '$lib/utils/timing/time.ts';

type MovieListsParams =
  & { slug: string; type: ListsType }
  & ApiParams;

const movieListsRequest = ({ fetch, slug, type }: MovieListsParams) =>
  api({ fetch })
    .movies
    .lists({
      params: {
        id: slug,
        type,
        sort: 'popular',
      },
      query: toListsQuery(type),
    });

export const movieListsQuery = defineQuery({
  key: 'movieLists',
  invalidations: [InvalidateAction.Listed],
  dependencies: (params) => [params.slug, params.type],
  request: movieListsRequest,
  mapper: (response) => response.body.map(mapToMediaListSummary),
  schema: MediaListSummarySchema.array(),
  ttl: time.minutes(30),
});
