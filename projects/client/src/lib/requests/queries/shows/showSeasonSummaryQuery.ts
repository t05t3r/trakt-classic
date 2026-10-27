import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToSeason } from '$lib/requests/_internal/mapToSeason.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { SeasonSchema } from '$lib/requests/models/Season.ts';
import { time } from '$lib/utils/timing/time.ts';

type ShowSeasonSummaryParams = {
  slug: string;
  season: number;
} & ApiParams;

const showSeasonSummaryRequest = (
  { fetch, slug, season }: ShowSeasonSummaryParams,
) =>
  // Unauthenticated, so the browser's request matches the server render's and reuses its response.
  api({ fetch, authenticated: false })
    .shows
    .season
    .info({
      params: {
        id: slug,
        season,
      },
      query: {
        extended: 'full,images',
      },
    });

// A 204, a season the show does not have, reads as null without reaching the mapper.
export const showSeasonSummaryQuery = defineQuery({
  key: 'showSeasonSummary',
  invalidations: [],
  dependencies: (params) => [params.slug, params.season],
  request: showSeasonSummaryRequest,
  mapper: (response) => mapToSeason(response.body),
  schema: SeasonSchema,
  ttl: time.hours(3),
});
