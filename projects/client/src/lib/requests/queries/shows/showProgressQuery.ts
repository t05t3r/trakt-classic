import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToEpisodeEntry } from '$lib/requests/_internal/mapToEpisodeEntry.ts';
import { toDistinctSeasonTitle } from '$lib/requests/_internal/toDistinctSeasonTitle.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import {
  type EpisodeProgress,
  type SeasonProgress,
  type ShowProgressDetail,
  ShowProgressDetailSchema,
} from '$lib/requests/models/ShowProgressDetail.ts';
import { getLatestDate } from '$lib/utils/date/getLatestDate.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { ShowProgressResponse } from '@trakt/api';

type ShowProgressParams = {
  slug: string;
  // False reads only what another read of the show cached.
  enabled?: boolean;
  // True counts the hidden seasons back in, as seasons.
  hidden?: boolean;
} & ApiParams;

const showProgressRequest = (
  { fetch, slug, hidden }: ShowProgressParams,
) =>
  api({ fetch })
    .shows
    .progress
    .watched({
      query: {
        count_specials: false,
        specials: false,
        hidden: hidden ?? false,
        extended: 'full,images',
        include_stats: true,
      },
      params: {
        id: slug,
      },
    });

type SeasonProgressResponse = ShowProgressResponse['seasons'][number];
type EpisodeProgressResponse = SeasonProgressResponse['episodes'][number];

function mapToEpisodeProgress(
  episode: EpisodeProgressResponse,
): EpisodeProgress {
  return {
    number: episode.number,
    completed: episode.completed,
    lastWatchedAt: episode.last_watched_at
      ? new Date(episode.last_watched_at)
      : null,
  };
}

function mapToSeasonProgress(season: SeasonProgressResponse): SeasonProgress {
  const episodes = season.episodes.map(mapToEpisodeProgress);

  return {
    number: season.number,
    title: toDistinctSeasonTitle(season.title),
    total: season.aired,
    completed: season.completed,
    lastWatchedAt:
      getLatestDate(episodes.map(({ lastWatchedAt }) => lastWatchedAt)) ?? null,
    episodes,
    plays: season.stats?.play_count ?? 0,
    minutesWatched: season.stats?.minutes_watched ?? 0,
    minutesLeft: season.stats?.minutes_left ?? 0,
  };
}

function mapToShowProgressDetail(
  item: ShowProgressResponse,
): ShowProgressDetail {
  return {
    total: item.aired,
    completed: item.completed,
    lastWatchedAt: item.last_watched_at ? new Date(item.last_watched_at) : null,
    nextEpisode: item.next_episode
      ? mapToEpisodeEntry(item.next_episode)
      : null,
    seasons: item.seasons.map(mapToSeasonProgress),
    hiddenSeasons: item.hidden_seasons.map(({ number, ids }) => ({
      id: ids.trakt,
      number,
    })),
  };
}

export const showProgressQuery = defineQuery({
  key: 'showProgress',
  invalidations: [
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.Rewatching('show'),
    InvalidateAction.HideProgress,
  ],
  dependencies: (params) => [params.slug, params.hidden ?? false],
  request: showProgressRequest,
  mapper: (response) => mapToShowProgressDetail(response.body),
  schema: ShowProgressDetailSchema,
  ttl: time.hours(3),
  enabled: (params) => params.enabled ?? true,
});
