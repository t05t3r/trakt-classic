import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { ShowEntrySchema } from '$lib/requests/models/ShowEntry.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { UpNextResponse } from '@trakt/api';
import { z } from 'zod';

const WatchedShowProgressSchema = z.object({
  show: ShowEntrySchema,
  watchedAt: z.date(),
});
export type WatchedShowProgress = z.infer<typeof WatchedShowProgressSchema>;

type WatchedShowsProgressParams = Pick<PaginationParams, 'page'> & ApiParams;

// A show with no date has no Play the route counts: it lists watchlisted shows, and it ignores specials.
function mapToWatchedShowProgress(
  { show, progress }: UpNextResponse,
): ReadonlyArray<WatchedShowProgress> {
  if (!progress.last_watched_at) return [];

  return [{
    show: mapToShowEntry(show),
    watchedAt: new Date(progress.last_watched_at),
  }];
}

const watchedShowsProgressRequest = (
  { fetch, page = 1 }: WatchedShowsProgressParams,
) =>
  api({ fetch })
    .sync
    .progress
    .watched({
      query: { extended: 'full,images', page, limit: MAX_PAGE_LIMIT },
    });

export const watchedShowsProgressQuery = defineInfiniteQuery({
  key: 'watchedShowsProgress',
  invalidations: [
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
  ],
  dependencies: (params: WatchedShowsProgressParams) => [params.page],
  request: watchedShowsProgressRequest,
  mapper: (response) => ({
    entries: response.body.flatMap(mapToWatchedShowProgress),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(WatchedShowProgressSchema),
  ttl: time.minutes(15),
});
