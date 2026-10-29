import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import { dedupe } from '$lib/utils/array/dedupe.ts';
import { COMMENTS_FIRST_REVEAL } from './COMMENTS_FIRST_REVEAL.ts';

export type CommentsReveal = {
  comments: ReadonlyArray<MediaComment>;
  showMore: boolean;
  showLess: boolean;
};

type RevealCommentsParams = {
  pages: ReadonlyArray<ReadonlyArray<MediaComment>>;
  step: number;
  hasNextPage: boolean;
};

const byKey = (comment: MediaComment) => comment.key;

export function revealComments(
  { pages, step, hasNextPage }: RevealCommentsParams,
): CommentsReveal {
  const loaded = dedupe(byKey, ...pages);
  const opened = dedupe(byKey, ...pages.slice(0, Math.max(step, 1)));
  const comments = step === 0 ? opened.slice(0, COMMENTS_FIRST_REVEAL) : opened;

  return {
    comments,
    showMore: hasNextPage || comments.length < loaded.length,
    showLess: step > 0,
  };
}
