import type { CommentsTarget } from '$lib/features/comments/stores/useComments.ts';
import { SILO_SEASON_PARAMS } from '$mocks/data/shows/SILO_SEASON_PARAMS.ts';

export const SILO_SEASON_COMMENTS_TARGET = {
  type: 'season',
  ...SILO_SEASON_PARAMS,
} satisfies CommentsTarget;
