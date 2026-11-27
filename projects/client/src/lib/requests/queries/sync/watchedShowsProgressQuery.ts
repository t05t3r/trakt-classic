import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import type { SortDirection } from '$lib/models/SortDirection.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { mapToEpisodeEntry } from '$lib/requests/_internal/mapToEpisodeEntry.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { mapToShowProgress } from '$lib/requests/_internal/mapToShowProgress.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { EpisodeEntrySchema } from '$lib/requests/models/EpisodeEntry.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { ShowEntrySchema } from '$lib/requests/models/ShowEntry.ts';
import { ShowProgressSchema } from '$lib/requests/models/ShowProgress.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { UpNextResponse, UpNextSortOption } from '@trakt/api';
import { z } from 'zod';

const WatchedShowProgressSchema = ShowProgressSchema.extend({
  show: ShowEntrySchema,
  plays: z.number(),
  minutesWatched: z.number(),
  nextEpisode: EpisodeEntrySchema.nullable(),
  lastEpisode: EpisodeEntrySchema.nullable(),
});
export type WatchedShowProgress = z.infer<typeof WatchedShowProgressSchema>;

export type WatchedShowsProgressParams =
  & Pick<PaginationParams, 'page'>
  & ApiParams
  & {
    sortBy?: UpNextSortOption;
    sortHow?: SortDirection;
    hideCompleted?: boolean;
  };

const DEFAULT_PARAMS = {
  page: 1,
  sortBy: 'added',
  sortHow: 'desc',
  hideCompleted: false,
} as const;

// A call without params and one at the defaults share one request and one key.
function withDefaults(params: WatchedShowsProgressParams) {
  return {
    ...params,
    page: params.page ?? DEFAULT_PARAMS.page,
    sortBy: params.sortBy ?? DEFAULT_PARAMS.sortBy,
    sortHow: params.sortHow ?? DEFAULT_PARAMS.sortHow,
    hideCompleted: params.hideCompleted ?? DEFAULT_PARAMS.hideCompleted,
  };
}

function mapToWatchedShowProgress(
  { show, progress }: UpNextResponse,
): WatchedShowProgress {
  return {
    show: mapToShowEntry(show),
    ...mapToShowProgress(progress),
    plays: progress.stats?.play_count ?? 0,
    minutesWatched: progress.stats?.minutes_watched ?? 0,
    nextEpisode: progress.next_episode
      ? mapToEpisodeEntry(progress.next_episode)
      : null,
    lastEpisode: progress.last_episode
      ? mapToEpisodeEntry(progress.last_episode)
      : null,
  };
}

const watchedShowsProgressRequest = (params: WatchedShowsProgressParams) => {
  const { fetch, page, sortBy, sortHow, hideCompleted } = withDefaults(
    params,
  );

  return api({ fetch })
    .sync
    .progress
    .watched({
      query: {
        extended: 'full,images',
        page,
        limit: MAX_PAGE_LIMIT,
        sort_by: sortBy,
        sort_how: sortHow,
        ...(hideCompleted ? { hide_completed: true } : {}),
      },
    });
};

export const watchedShowsProgressQuery = defineInfiniteQuery({
  key: 'watchedShowsProgress',
  invalidations: [
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.HideProgress,
  ],
  dependencies: (params: WatchedShowsProgressParams) => {
    const { page, sortBy, sortHow, hideCompleted } = withDefaults(params);

    return [page, sortBy, sortHow, hideCompleted];
  },
  request: watchedShowsProgressRequest,
  mapper: (response) => ({
    entries: response.body.map(mapToWatchedShowProgress),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(WatchedShowProgressSchema),
  ttl: time.minutes(15),
});
