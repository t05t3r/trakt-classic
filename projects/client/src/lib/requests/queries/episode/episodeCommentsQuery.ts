import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import { mapToMediaComment } from '$lib/requests/_internal/mapToMediaComment.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import type { CommentSortType } from '$lib/requests/models/CommentSortType.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MediaCommentSchema } from '$lib/requests/models/MediaComment.ts';
import { time } from '$lib/utils/timing/time.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';

type EpisodeCommentsParams =
  & {
    slug: string;
    season: number;
    episode: number;
    sort: CommentSortType;
    language?: string;
  }
  & ApiParams
  & PaginationParams;

const showCommentsRequest = (
  {
    fetch,
    slug,
    season,
    episode,
    limit,
    page,
    sort,
    language,
  }: EpisodeCommentsParams,
) =>
  api({ fetch })
    .shows
    .episode
    .comments({
      params: {
        id: slug,
        season,
        episode,
        sort,
      },
      query: {
        extended: 'images',
        limit,
        page,
        language,
      },
    });

export const episodeCommentsQuery = defineInfiniteQuery({
  key: 'episodeComments',
  invalidations: [
    InvalidateAction.Comment.Post('episode'),
    InvalidateAction.Comment.Reply('episode'),
  ],
  dependencies: (
    params,
  ) => [
    params.slug,
    params.season,
    params.episode,
    params.page,
    params.limit,
    params.sort,
    params.language,
  ],
  request: showCommentsRequest,
  mapper: (response) => ({
    entries: response.body.map(mapToMediaComment),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(MediaCommentSchema),
  ttl: time.minutes(30),
});
