import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { WATCHLISTED_INVALIDATIONS } from '$lib/requests/_internal/WATCHLISTED_INVALIDATIONS.ts';
import { getGlobalFilterDependencies } from '$lib/requests/_internal/getGlobalFilterDependencies.ts';
import {
  mapToTargetId,
  TargetItemSchema,
} from '$lib/requests/_internal/mapToTargetId.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import type { FilterParams } from '$lib/requests/models/FilterParams.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { TargetIdSchema } from '$lib/requests/models/TargetId.ts';
import { time } from '$lib/utils/timing/time.ts';
import { z } from 'zod';
import type { WatchlistType } from './watchlistQuery.ts';

type WatchlistGenreCountParams =
  & { type?: WatchlistType }
  & Pick<PaginationParams, 'page'>
  & ApiParams
  & FilterParams;

const watchlistGenreCountRequest = (
  { fetch, type = 'all', page = 1, filter }: WatchlistGenreCountParams,
) =>
  api({ fetch })
    .users
    .watchlist
    .typedSorted({
      params: { id: 'me', type, sort_by: 'rank', sort_how: 'asc' },
      query: { page, limit: MAX_PAGE_LIMIT, ...filter },
    });

export const watchlistGenreCountQuery = defineInfiniteQuery({
  key: 'watchlistGenreCount',
  invalidations: WATCHLISTED_INVALIDATIONS,
  dependencies: (params) => [
    params.type,
    params.page,
    ...getGlobalFilterDependencies(params.filter),
  ],
  request: watchlistGenreCountRequest,
  mapper: (response, { page = 1 }) => {
    const entries = z.array(TargetItemSchema).parse(response.body).map(
      mapToTargetId,
    );

    // Under a genre filter both page headers count the whole watchlist, so paging ends at an empty page.
    return { entries, page: { type: 'infinite' as const, current: page } };
  },
  schema: PaginatableSchemaFactory(TargetIdSchema),
  ttl: time.hours(1),
  enabled: (params) => Boolean(params.filter?.genres),
});
