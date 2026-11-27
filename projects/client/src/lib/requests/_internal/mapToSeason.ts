import { mapToPoster } from '$lib/requests/_internal/mapToPoster.ts';
import { mapToTraktRating } from '$lib/requests/_internal/mapToTraktRating.ts';
import { toDistinctSeasonTitle } from '$lib/requests/_internal/toDistinctSeasonTitle.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { findDefined } from '$lib/utils/string/findDefined.ts';
import type { SeasonsResponse } from '@trakt/api';
import type { Season } from '../models/Season.ts';

export const mapToSeason = (item: SeasonsResponse[0]): Season => {
  const poster = findDefined(
    ...(item.images?.poster ?? []),
  );

  const episodeCount = item.episode_count ?? 0;

  return {
    id: item.ids.trakt,
    key: `season-${item.ids.trakt}`,
    number: item.number,
    title: toDistinctSeasonTitle(item.title),
    episodes: {
      count: episodeCount,
      aired: Math.min(item.aired_episodes ?? episodeCount, episodeCount),
    },
    poster: poster ? mapToPoster(item.images) : undefined,
    airDate: new Date(item.first_aired ?? MAX_DATE),
    overview: item.overview ?? null,
    rating: mapToTraktRating(item.rating),
    votes: item.votes ?? null,
    network: item.network,
    totalRuntime: item.total_runtime ?? NaN,
  };
};
