import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';
import { time } from '$lib/utils/timing/time.ts';

type MovieOfficialListParams = { slug: string } & ApiParams;

const movieOfficialListRequest = (
  { fetch, slug }: MovieOfficialListParams,
) =>
  api({ fetch })
    .movies
    .lists({
      params: {
        id: slug,
        type: 'official',
        sort: 'popular',
      },
      query: {
        extended: 'images',
        limit: 1,
        page: 1,
      },
    });

export const movieOfficialListQuery = defineQuery({
  key: 'movieOfficialList',
  invalidations: [],
  dependencies: (params) => [params.slug],
  request: movieOfficialListRequest,
  mapper: (response) => response.body.map(mapToMediaListSummary).at(0) ?? null,
  schema: MediaListSummarySchema.nullable(),
  ttl: time.minutes(30),
});
