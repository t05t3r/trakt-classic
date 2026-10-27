import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToEpisodeStats } from '$lib/requests/_internal/mapToEpisodeStats.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { EpisodeStatsSchema } from '$lib/requests/models/EpisodeStats.ts';
import { time } from '$lib/utils/timing/time.ts';

type ShowSeasonStatsParams = {
  slug: string;
  season: number;
} & ApiParams;

const showSeasonStatsRequest = (
  { fetch, slug, season }: ShowSeasonStatsParams,
) =>
  api({ fetch })
    .shows
    .season
    .stats({
      params: {
        id: slug,
        season,
      },
    });

// The API answers a season's stats in the episode stats shape.
export const showSeasonStatsQuery = defineQuery({
  key: 'showSeasonStats',
  invalidations: [],
  dependencies: (params) => [params.slug, params.season],
  request: showSeasonStatsRequest,
  mapper: (response) => mapToEpisodeStats(response.body),
  schema: EpisodeStatsSchema,
  ttl: time.minutes(30),
});
