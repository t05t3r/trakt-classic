import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import { mapToCountryStreamingServices } from '$lib/requests/_internal/mapToCountryStreamingServices.ts';
import { CountryStreamingServiceOptionsSchema } from '$lib/requests/models/CountryStreamingServiceOptions.ts';

type StreamAllEpisodeParams = {
  slug: string;
  season: number;
  episode: number;
} & ApiParams;

const streamAllEpisodeRequest = (
  { fetch, slug, season, episode }: StreamAllEpisodeParams,
) =>
  api({ fetch })
    .shows
    .episode
    .watchnow({
      params: {
        id: slug,
        season,
        episode,
      },
    });

export const streamAllEpisodeQuery = defineQuery({
  key: 'streamAllEpisode',
  invalidations: [],
  dependencies: (
    params,
  ) => [params.slug, params.season, params.episode],
  request: streamAllEpisodeRequest,
  mapper: (response) => mapToCountryStreamingServices(response.body),
  schema: CountryStreamingServiceOptionsSchema.array(),
  ttl: time.hours(3),
});
