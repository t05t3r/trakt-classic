import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { fetchPeopleWithGuestStars } from '$lib/requests/_internal/fetchPeopleWithGuestStars.ts';
import { mapToMediaCrew } from '$lib/requests/_internal/mapToMediaCrew.ts';
import type { ApiParams } from '$lib/requests/api.ts';
import { MediaCrewSchema } from '$lib/requests/models/MediaCrew.ts';
import { time } from '$lib/utils/timing/time.ts';

type ShowSeasonPeopleParams = {
  slug: string;
  season: number;
} & ApiParams;

const showSeasonPeopleRequest = (
  { fetch, slug, season }: ShowSeasonPeopleParams,
) => fetchPeopleWithGuestStars({ fetch, slug, season });

export const showSeasonPeopleQuery = defineQuery({
  key: 'showSeasonPeople',
  invalidations: [],
  dependencies: (params) => [params.slug, params.season],
  request: showSeasonPeopleRequest,
  mapper: (response) => mapToMediaCrew(response.body),
  schema: MediaCrewSchema,
  ttl: time.hours(12),
});
