import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMovieEntry } from '$lib/requests/_internal/mapToMovieEntry.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MediaEntrySchema } from '$lib/requests/models/MediaEntry.ts';
import { time } from '$lib/utils/timing/time.ts';

type MovieSummaryParams = { slug: string } & ApiParams;

const movieSummaryRequest = (
  { fetch, slug }: MovieSummaryParams,
) =>
  // Unauthenticated, so the browser's request matches the server render's and reuses its response.
  api({ fetch, authenticated: false })
    .movies
    .summary({
      params: {
        id: slug,
      },
      query: {
        extended: 'full,images',
      },
    });

export const movieSummaryQuery = defineQuery({
  key: 'movieSummary:v2',
  invalidations: [],
  dependencies: (params) => [params.slug],
  request: movieSummaryRequest,
  mapper: (response) => mapToMovieEntry(response.body),
  schema: MediaEntrySchema,
  ttl: time.hours(3),
});
