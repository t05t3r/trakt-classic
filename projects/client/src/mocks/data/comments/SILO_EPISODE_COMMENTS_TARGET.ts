import type { CommentsTarget } from '$lib/features/comments/stores/useComments.ts';
import { SILO_EPISODE_PARAMS } from '$mocks/data/shows/SILO_EPISODE_PARAMS.ts';

export const SILO_EPISODE_COMMENTS_TARGET = {
  type: 'episode',
  ...SILO_EPISODE_PARAMS,
} satisfies CommentsTarget;
