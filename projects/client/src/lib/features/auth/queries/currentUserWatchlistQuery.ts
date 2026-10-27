import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import {
  mapToTargetId,
  TargetItemSchema,
} from '$lib/requests/_internal/mapToTargetId.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { TargetIdSchema } from '$lib/requests/models/TargetId.ts';
import { time } from '$lib/utils/timing/time.ts';
import { z } from 'zod';

const WatchlistItemSchema = TargetItemSchema.and(
  z.object({ listed_at: z.string() }),
);

const WatchlistedTargetSchema = TargetIdSchema.extend({ listedAt: z.date() });
export type WatchlistedTarget = z.infer<typeof WatchlistedTargetSchema>;

function mapToWatchlistedTarget(
  item: z.infer<typeof WatchlistItemSchema>,
): WatchlistedTarget {
  return { ...mapToTargetId(item), listedAt: new Date(item.listed_at) };
}

const currentUserWatchlistRequest = (
  { fetch, page = 1 }: Pick<PaginationParams, 'page'> & ApiParams,
) =>
  api({ fetch })
    .sync
    .watchlist
    .get({
      params: { type: 'all', sort_by: 'rank', sort_how: 'asc' },
      query: { page, limit: MAX_PAGE_LIMIT },
    });

export const currentUserWatchlistQuery = defineInfiniteQuery({
  key: 'currentUserWatchlist',
  invalidations: [
    InvalidateAction.Watchlisted('movie'),
    InvalidateAction.Watchlisted('show'),
    InvalidateAction.Watchlisted('season'),
    InvalidateAction.Watchlisted('episode'),
    InvalidateAction.MarkAsWatched('movie'),
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
  ],
  dependencies: (params) => [params.page],
  request: currentUserWatchlistRequest,
  mapper: (response) => ({
    entries: z.array(WatchlistItemSchema).parse(response.body).map(
      mapToWatchlistedTarget,
    ),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(WatchlistedTargetSchema),
  ttl: time.hours(12),
});
