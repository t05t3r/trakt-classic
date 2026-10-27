import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { toListsQuery } from '$lib/requests/_internal/toListsQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { ListsType } from '$lib/requests/models/ListsType.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { time } from '$lib/utils/timing/time.ts';

type EpisodeListsParams =
  & { slug: string; season: number; episode: number; type: ListsType }
  & ApiParams;

const episodeListsRequest = (
  { fetch, slug, season, episode, type }: EpisodeListsParams,
) =>
  api({ fetch })
    .shows
    .episode
    .lists({
      params: {
        id: slug,
        season,
        episode,
        type,
        sort: 'popular',
      },
      query: toListsQuery(type),
    });

export const episodeListsQuery = defineQuery({
  key: 'episodeLists',
  invalidations: [InvalidateAction.Listed],
  dependencies: (params) => [
    params.slug,
    params.season,
    params.episode,
    params.type,
  ],
  request: episodeListsRequest,
  mapper: (response) => response.body.map(mapToMediaListSummary),
  schema: MediaListSummarySchema.array(),
  ttl: time.minutes(30),
});
