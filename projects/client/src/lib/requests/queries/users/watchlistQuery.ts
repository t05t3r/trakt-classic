import type { ListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';
import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { getGlobalFilterDependencies } from '$lib/requests/_internal/getGlobalFilterDependencies.ts';
import { mapToListItem } from '$lib/requests/_internal/mapToListItem.ts';
import { WATCHLIST_INVALIDATIONS } from '$lib/requests/_internal/WATCHLIST_INVALIDATIONS.ts';
import { withoutNullSeasonAirDate } from '$lib/requests/_internal/withoutNullSeasonAirDate.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import type { FilterParams } from '$lib/requests/models/FilterParams.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { LIST_PAGE_SIZE } from '$lib/utils/LIST_PAGE_SIZE.ts';
import { time } from '$lib/utils/timing/time.ts';
import { listedAllResponseSchema } from '@trakt/api';
import { z } from 'zod';
import type { SortBy } from '$lib/models/SortBy.ts';
import type { SortDirection } from '$lib/models/SortDirection.ts';
import {
  type ListItem,
  ListItemSchema,
} from '$lib/requests/models/ListItem.ts';

export type WatchlistType = ListTypeSegment<'watchlist'>;

type WatchlistParams =
  & {
    sortBy: SortBy;
    sortHow: SortDirection;
    type?: WatchlistType;
  }
  & Pick<PaginationParams, 'page'>
  & ApiParams
  & FilterParams;

const ListedRowSchema = z.preprocess(
  withoutNullSeasonAirDate,
  listedAllResponseSchema,
);

// The SDK types the watchlist routes' items loosely, so they are parsed here.
export function mapToListItems(body: unknown): ListItem[] {
  return ListedRowSchema.array().parse(body).map(mapToListItem);
}

const watchlistRequest = (
  { fetch, sortBy, sortHow, type = 'all', page, filter }: WatchlistParams,
) =>
  api({ fetch })
    .users
    .watchlist
    .typedSorted({
      params: {
        id: 'me',
        type,
        sort_by: sortBy,
        sort_how: sortHow,
      },
      query: {
        extended: 'full,images,colors',
        page,
        limit: LIST_PAGE_SIZE,
        ...filter,
      },
    });

export const watchlistQuery = defineInfiniteQuery({
  key: 'watchlist',
  invalidations: WATCHLIST_INVALIDATIONS,
  dependencies: (
    params: WatchlistParams,
  ) => [
    params.type,
    params.sortBy,
    params.sortHow,
    params.page,
    ...getGlobalFilterDependencies(params.filter),
  ],
  request: watchlistRequest,
  mapper: (response) => ({
    entries: mapToListItems(response.body),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(ListItemSchema),
  ttl: time.hours(1),
});
