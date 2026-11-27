import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { MAX_PAGE_LIMIT } from '$lib/requests/MAX_PAGE_LIMIT.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';
import { time } from '$lib/utils/timing/time.ts';
import { z } from 'zod';

const IdsSchema = z.object({ trakt: z.number() });

// `@trakt/api` types every entry of this route as a show.
export const HiddenSeasonResponseSchema = z.object({
  hidden_at: z.string().nullish(),
  type: z.literal('season'),
  season: z.object({ ids: IdsSchema, number: z.number() }),
  show: z.object({ ids: IdsSchema }),
});
export type HiddenSeasonResponse = z.infer<typeof HiddenSeasonResponseSchema>;

export const HiddenSeasonSchema = z.object({
  showId: z.number(),
  number: z.number(),
});
export type HiddenSeason = z.infer<typeof HiddenSeasonSchema>;

const mapToHiddenSeason = (
  { show, season }: HiddenSeasonResponse,
): HiddenSeason => ({ showId: show.ids.trakt, number: season.number });

type HiddenSeasonsParams = Pick<PaginationParams, 'page'> & ApiParams;

const hiddenSeasonsRequest = ({ fetch, page = 1 }: HiddenSeasonsParams) =>
  api({ fetch })
    .users
    .hidden
    .getBySection({
      params: { section: 'progress_watched' },
      query: { type: 'season', page, limit: MAX_PAGE_LIMIT },
    });

export const hiddenSeasonsQuery = defineInfiniteQuery({
  key: 'hiddenSeasons',
  invalidations: [InvalidateAction.HideProgress],
  dependencies: (params: HiddenSeasonsParams) => [params.page],
  request: hiddenSeasonsRequest,
  mapper: (response) => ({
    entries: z.array(HiddenSeasonResponseSchema).parse(response.body)
      .map(mapToHiddenSeason),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(HiddenSeasonSchema),
  ttl: time.hours(3),
});
