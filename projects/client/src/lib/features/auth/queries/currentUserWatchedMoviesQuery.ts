import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { z } from 'zod';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import { WatchedMediaSchema } from './_internal/WatchedHistorySchema.ts';
import { getLastWatchedAt } from './_internal/getLastWatchedAt.ts';

export const WatchMovieSchema = WatchedMediaSchema.extend({
  watchedDates: z.array(z.date()),
});
export type WatchedMovie = z.infer<typeof WatchMovieSchema>;

function mapWatchedMovieResponse(
  [id, timestamps]: [string, string[]],
): WatchedMovie {
  return {
    id: Number(id),
    watchedAt: getLastWatchedAt(timestamps),
    plays: timestamps.length,
    watchedDates: timestamps.map((t) => new Date(t)),
  };
}

type CurrentUserWatchedMoviesParams = PaginationParams & ApiParams;

const currentUserWatchedMoviesRequest = (
  { fetch, page = 1, limit = MAX_PAGE_LIMIT }: CurrentUserWatchedMoviesParams,
) => {
  const pagination = {
    page,
    limit,
  };

  return api({ fetch })
    .users
    .watched
    .minimal
    .movies({
      params: { id: 'me' },
      query: {
        extended: 'min',
        ...pagination,
      },
    });
};

export const currentUserWatchedMoviesQuery = defineInfiniteQuery({
  key: 'currentUserWatchedMovies',
  invalidations: [
    InvalidateAction.MarkAsWatched('movie'),
  ],
  dependencies: (params) => [params.limit],
  request: currentUserWatchedMoviesRequest,
  // Trakt sends these pages without page headers, so paging ends at an empty one.
  mapper: (response) => ({
    entries: Object.entries(response.body).map(mapWatchedMovieResponse),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(WatchMovieSchema),
  ttl: time.hours(12),
});
