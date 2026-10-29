import type { CommentsTarget } from '$lib/features/comments/stores/useComments.ts';

export const SILO_COMMENTS_TARGET = {
  type: 'show',
  slug: 'silo',
} satisfies CommentsTarget;
