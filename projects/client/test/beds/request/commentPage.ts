import { COMMENTS_PAGE_SIZE } from '$lib/features/comments/_internal/COMMENTS_PAGE_SIZE.ts';
import type { CommentResponseWithGif } from '$lib/requests/models/CommentResponseWithGif.ts';
import { commentResponse } from '$test/beds/request/commentResponse.ts';

type CommentPageParams = {
  page: number;
  count?: number;
};

// Ids follow the page size, so a short page leaves no id to the next one.
export function commentPage(
  { page, count = COMMENTS_PAGE_SIZE }: CommentPageParams,
): ReadonlyArray<CommentResponseWithGif> {
  const first = (page - 1) * COMMENTS_PAGE_SIZE + 1;

  return Array.from(
    { length: count },
    (_, index) => commentResponse({ id: first + index }),
  );
}
