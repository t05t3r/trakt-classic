import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMediaComment } from '$lib/requests/_internal/mapToMediaComment.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import type { CommentSortType } from '$lib/requests/models/CommentSortType.ts';
import { MediaCommentSchema } from '$lib/requests/models/MediaComment.ts';
import { time } from '$lib/utils/timing/time.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';

type MovieCommentsParams =
  & { slug: string; sort: CommentSortType; language?: string }
  & ApiParams
  & PaginationParams;

const movieCommentsRequest = (
  { fetch, slug, limit, page, sort, language }: MovieCommentsParams,
) =>
  api({ fetch })
    .movies
    .comments({
      params: {
        id: slug,
        sort,
      },
      query: {
        extended: 'images',
        limit,
        page,
        language,
      },
    });

export const movieCommentsQuery = defineInfiniteQuery({
  key: 'movieComments',
  invalidations: [],
  dependencies: (
    params,
  ) => [params.slug, params.page, params.limit, params.sort, params.language],
  request: movieCommentsRequest,
  mapper: (response) => ({
    entries: response.body.map(mapToMediaComment),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(MediaCommentSchema),
  ttl: time.minutes(30),
});
