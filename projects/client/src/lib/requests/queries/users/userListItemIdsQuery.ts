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

type UserListItemIdsParams =
  & {
    userId: string;
    listId: string | number;
  }
  & Pick<PaginationParams, 'page'>
  & ApiParams;

const userListItemIdsRequest = (
  { fetch, userId, listId, page = 1 }: UserListItemIdsParams,
) =>
  api({ fetch })
    .users
    .lists
    .list
    .items
    .all({
      params: { id: userId, list_id: `${listId}` },
      query: { page, limit: MAX_PAGE_LIMIT },
    });

export const userListItemIdsQuery = defineInfiniteQuery({
  key: 'userListItemIds',
  invalidations: (params) => [InvalidateAction.ListedIn(params.listId)],
  dependencies: (params) => [params.userId, params.listId, params.page],
  request: userListItemIdsRequest,
  mapper: (response) => ({
    entries: z.array(TargetItemSchema).parse(response.body).map(
      mapToTargetId,
    ),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(TargetIdSchema),
  ttl: time.hours(3),
});
