import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { z } from 'zod';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import { WatchedMediaSchema } from './_internal/WatchedHistorySchema.ts';
import { getLastWatchedAt } from './_internal/getLastWatchedAt.ts';
import { minimalPageMeta } from './_internal/minimalPageMeta.ts';

const DEFAULT_LIMIT = 250;

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
  { fetch, page = 1, limit = DEFAULT_LIMIT }: CurrentUserWatchedMoviesParams,
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
  mapper: (response, { page = 1, limit = DEFAULT_LIMIT }) => {
    const entries = Object.entries(response.body).map(mapWatchedMovieResponse);

    return {
      entries,
      page: minimalPageMeta({
        headers: response.headers,
        entryCount: entries.length,
        page,
        limit,
      }),
    };
  },
  schema: PaginatableSchemaFactory(WatchMovieSchema),
  ttl: time.hours(12),
});
