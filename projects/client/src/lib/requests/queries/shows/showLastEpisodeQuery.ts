import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToEpisodeEntry } from '$lib/requests/_internal/mapToEpisodeEntry.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { EpisodeEntrySchema } from '$lib/requests/models/EpisodeEntry.ts';
import { time } from '$lib/utils/timing/time.ts';

type ShowLastEpisodeParams = {
  slug: string;
} & ApiParams;

const showLastEpisodeRequest = (
  { fetch, slug }: ShowLastEpisodeParams,
) =>
  api({ fetch })
    .shows
    .lastEpisode({
      params: {
        id: slug,
      },
      query: {
        extended: 'full,images',
      },
    });

// A 204, nothing aired yet, reads as null without reaching the mapper.
export const showLastEpisodeQuery = defineQuery({
  key: 'showLastEpisode',
  invalidations: [],
  dependencies: (params) => [params.slug],
  request: showLastEpisodeRequest,
  mapper: (response) => mapToEpisodeEntry(response.body),
  schema: EpisodeEntrySchema.nullable(),
  ttl: time.hours(3),
});
