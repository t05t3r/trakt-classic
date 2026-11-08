import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMovieEntry } from '$lib/requests/_internal/mapToMovieEntry.ts';
import { RELATED_LIMIT } from '$lib/requests/RELATED_LIMIT.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MovieEntrySchema } from '$lib/requests/models/MovieEntry.ts';
import { time } from '$lib/utils/timing/time.ts';

type MovieRelatedParams = { slug: string } & ApiParams;

const movieRelatedRequest = ({ fetch, slug }: MovieRelatedParams) =>
  api({ fetch })
    .movies
    .related({
      query: {
        extended: 'full,images',
        limit: RELATED_LIMIT,
        page: 1,
      },
      params: {
        id: slug,
      },
    });

export const movieRelatedQuery = defineQuery({
  key: 'movieRelated',
  invalidations: [],
  dependencies: (params) => [params.slug],
  request: movieRelatedRequest,
  mapper: (response) => response.body.map(mapToMovieEntry),
  schema: MovieEntrySchema.array(),
  ttl: time.hours(12),
});
