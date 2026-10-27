import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { mapToEpisodeActivityHistory } from '$lib/requests/_internal/mapToEpisodeActivityHistory.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { EpisodeEntrySchema } from '$lib/requests/models/EpisodeEntry.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import { ShowEntrySchema } from '$lib/requests/models/ShowEntry.ts';
import { time } from '$lib/utils/timing/time.ts';
import { z } from 'zod';
import { getGlobalFilterDependencies } from '$lib/requests/_internal/getGlobalFilterDependencies.ts';
import type { FilterParams } from '$lib/requests/models/FilterParams.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';

type EpisodeActivityHistoryParams =
  & {
    slug: string;
    startDate?: Date;
    endDate?: Date;
    id?: number;
    syncId?: number;
  }
  & ApiParams
  & PaginationParams
  & FilterParams;

export const EpisodeActivityHistorySchema = z.object({
  id: z.number(),
  key: z.string(),
  watchedAt: z.date(),
  episode: EpisodeEntrySchema,
  show: ShowEntrySchema,
  type: z.literal('episode'),
});
export type EpisodeActivityHistory = z.infer<
  typeof EpisodeActivityHistorySchema
>;

function episodeActivityHistoryRequest(
  { fetch, slug, startDate, endDate, limit, id, page, filter, syncId }:
    EpisodeActivityHistoryParams,
) {
  const queryParams = {
    extended: 'full,images' as const,
    start_at: startDate?.toISOString(),
    end_at: endDate?.toISOString(),
    limit,
    page,
    sync_id: syncId,
    ...filter,
  };

  return id
    ? api({ fetch }).users.history.episode({
      params: { id: slug, item_id: `${id}` },
      query: queryParams,
    })
    : api({ fetch }).users.history.episodes({
      params: { id: slug },
      query: queryParams,
    });
}

export const episodeActivityHistoryQuery = defineInfiniteQuery({
  key: 'episodeHistory',
  invalidations: [
    InvalidateAction.MarkAsWatched('episode'),
    InvalidateAction.MarkAsWatched('show'),
  ],
  dependencies: (params) => [
    params.startDate,
    params.endDate,
    params.limit,
    params.page,
    params.id,
    params.slug,
    params.syncId,
    ...getGlobalFilterDependencies(params.filter),
  ],
  request: episodeActivityHistoryRequest,
  mapper: (response) => ({
    entries: response.body.map(mapToEpisodeActivityHistory),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(EpisodeActivityHistorySchema),
  ttl: time.hours(1),
});
