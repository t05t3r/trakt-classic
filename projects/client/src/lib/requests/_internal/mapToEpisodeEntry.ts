import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { findDefined } from '$lib/utils/string/findDefined.ts';
import type {
  CalendarShowResponse,
  EpisodeResponse as TraktEpisodeResponse,
  UpNextResponse,
} from '@trakt/api';
import type { EpisodeEntry } from '../models/EpisodeEntry.ts';
import { type EpisodeType, EpisodeUnknownType } from '../models/EpisodeType.ts';
import { mapToImage } from './mapToImage.ts';
import { mapToPostCredits } from './mapToPostCredits.ts';
import { mapToTraktRating } from './mapToTraktRating.ts';

type EpisodeResponse =
  | UpNextResponse['progress']['next_episode']
  | CalendarShowResponse['episode']
  | TraktEpisodeResponse;

export function mapToEpisodeEntry(
  episodeResponse: EpisodeResponse,
): EpisodeEntry {
  const episode = assertDefined(
    episodeResponse,
    'Episode response is undefined',
  );
  const posterCandidate = findDefined(...(episode.images?.screenshot ?? []));

  const airDate = new Date(episode.first_aired ?? MAX_DATE);
  const releaseDate = new Date(episode.released ?? MAX_DATE);
  const effectiveReleaseDate = new Date(
    episode.effective_release_date ?? MAX_DATE,
  );

  return {
    id: episode.ids.trakt,
    imdbId: episode.ids.imdb,
    key: `episode-${episode.ids.trakt}`,
    type: episode.episode_type as EpisodeType ??
      EpisodeUnknownType.unknown,
    title: episode.title ?? '',
    overview: episode.overview ?? '',
    season: episode.season,
    genres: [],
    number: episode.number,
    runtime: episode.runtime ?? NaN,
    cover: {
      url: mapToImage({
        candidate: posterCandidate,
        placeholder: PLACEHOLDERS.fanart,
      }),
    },
    airDate,
    releaseDate,
    effectiveReleaseDate,
    year: effectiveReleaseDate.getFullYear(),
    postCredits: mapToPostCredits(episode),
    rating: mapToTraktRating(episode.rating),
    ...(episode.votes != null ? { votes: episode.votes } : {}),
    ...(episode.updated_at ? { updatedAt: new Date(episode.updated_at) } : {}),
  };
}
