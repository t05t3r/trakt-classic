import type {
  CastMember,
  CrewMember,
  MediaCrew,
} from '$lib/requests/models/MediaCrew.ts';
import type { PeopleGuestStarsResponse } from '$lib/requests/models/PeopleGuestStarsResponse.ts';
import type { CastResponse, CrewResponse } from '@trakt/api';
import { mapToHeadshot } from './mapToHeadshot.ts';

function toMember(response: CrewResponse | CastResponse) {
  return ({
    name: response.person.name,
    key: response.person.ids.slug,
    ...(response.episode_count != null
      ? { episodeCount: response.episode_count }
      : {}),
  });
}

function toCrewMember(
  crewResponse: CrewResponse,
): CrewMember {
  return ({
    ...toMember(crewResponse),
    jobs: crewResponse.jobs,
  });
}

function toCastMember(
  castResponse: CastResponse,
): CastMember {
  const characters = castResponse.characters ?? [];

  return ({
    ...toMember(castResponse),
    characterName: castResponse.character ?? characters.at(0) ?? '',
    ...(characters.length > 1 ? { characters } : {}),
    headshot: mapToHeadshot(castResponse.person.images),
  });
}

export function mapToMediaCrew(
  response: PeopleGuestStarsResponse | undefined,
): MediaCrew {
  if (response == null) {
    throw new Error('People response body is missing');
  }

  return {
    directors: (response.crew?.directing ?? [])
      .map(toCrewMember),
    writers: (response.crew?.writing ?? [])
      .map(toCrewMember),
    creators: (response.crew?.['created by'] ?? [])
      .map(toCrewMember),
    cast: (response.cast ?? [])
      .map(toCastMember),
    guestStars: (response.guest_stars ?? [])
      .map(toCastMember),
  };
}
