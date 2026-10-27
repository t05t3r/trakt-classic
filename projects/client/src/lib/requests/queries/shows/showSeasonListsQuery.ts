import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { toListsQuery } from '$lib/requests/_internal/toListsQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { ListsType } from '$lib/requests/models/ListsType.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { time } from '$lib/utils/timing/time.ts';

type ShowSeasonListsParams =
  & { slug: string; season: number; type: ListsType }
  & ApiParams;

const showSeasonListsRequest = (
  { fetch, slug, season, type }: ShowSeasonListsParams,
) =>
  api({ fetch })
    .shows
    .season
    .lists({
      params: {
        id: slug,
        season,
        type,
        sort: 'popular',
      },
      query: toListsQuery(type),
    });

export const showSeasonListsQuery = defineQuery({
  key: 'showSeasonLists',
  invalidations: [InvalidateAction.Listed],
  dependencies: (params) => [params.slug, params.season, params.type],
  request: showSeasonListsRequest,
  mapper: (response) => response.body.map(mapToMediaListSummary),
  schema: MediaListSummarySchema.array(),
  ttl: time.minutes(30),
});
