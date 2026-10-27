import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToEpisodeEntry } from '$lib/requests/_internal/mapToEpisodeEntry.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import {
  type ShowProgressDetail,
  ShowProgressDetailSchema,
} from '$lib/requests/models/ShowProgressDetail.ts';
import { getLatestDate } from '$lib/utils/date/getLatestDate.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { ShowProgressResponse } from '@trakt/api';

const showProgressRequest = (
  { fetch, slug }: { slug: string } & ApiParams,
) =>
  api({ fetch })
    .shows
    .progress
    .watched({
      query: {
        count_specials: false,
        specials: false,
        hidden: false,
        extended: 'full,images',
        include_stats: true,
      },
      params: {
        id: slug,
      },
    });

type SeasonProgressResponse = ShowProgressResponse['seasons'][number];

function toSeasonLastWatchedAt(
  { episodes }: SeasonProgressResponse,
): Date | null {
  const dates = episodes.flatMap(({ last_watched_at }) =>
    last_watched_at ? [new Date(last_watched_at)] : []
  );

  return getLatestDate(dates) ?? null;
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
    seasons: item.seasons.map((season) => ({
      number: season.number,
      total: season.aired,
      completed: season.completed,
      lastWatchedAt: toSeasonLastWatchedAt(season),
    })),
  };
}

export const showProgressQuery = defineQuery({
  key: 'showProgress',
  invalidations: [
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.Rewatching('show'),
  ],
  dependencies: (params) => [params.slug],
  request: showProgressRequest,
  mapper: (response) => mapToShowProgressDetail(response.body),
  schema: ShowProgressDetailSchema,
  ttl: time.hours(3),
});
