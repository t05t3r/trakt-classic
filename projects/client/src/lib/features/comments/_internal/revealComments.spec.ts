import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { idsOf } from '$test/beds/store/idsOf.ts';
import { MovieHereticCommentsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticCommentsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { type CommentsReveal, revealComments } from './revealComments.ts';

const COMMENT = assertDefined(MovieHereticCommentsMappedMock.at(0));

function page(first: number, count: number): ReadonlyArray<MediaComment> {
  return Array.from({ length: count }, (_, index) => ({
    ...COMMENT,
    id: first + index,
    key: `comment-${first + index}`,
  }));
}

function toIds({ comments, ...flags }: CommentsReveal) {
  return { ids: idsOf(comments), ...flags };
}

describe('util: revealComments', () => {
  it("should show page one's first three, with more and no less", () => {
    const reveal = revealComments({
      pages: [page(1, 10)],
      step: 0,
      hasNextPage: true,
    });

    expect(toIds(reveal)).toEqual({
      ids: [1, 2, 3],
      showMore: true,
      showLess: false,
    });
  });

  it('should show no more when page one holds three and no page follows', () => {
    const reveal = revealComments({
      pages: [page(1, 3)],
      step: 0,
      hasNextPage: false,
    });

    expect(toIds(reveal)).toEqual({
      ids: [1, 2, 3],
      showMore: false,
      showLess: false,
    });
  });

  it('should show nothing when page one is empty', () => {
    const reveal = revealComments({
      pages: [[]],
      step: 0,
      hasNextPage: false,
    });

    expect(toIds(reveal)).toEqual({
      ids: [],
      showMore: false,
      showLess: false,
    });
  });

  it('should show the rest of a short page one at the first step', () => {
    const reveal = revealComments({
      pages: [page(1, 8)],
      step: 1,
      hasNextPage: true,
    });

    expect(toIds(reveal)).toEqual({
      ids: [1, 2, 3, 4, 5, 6, 7, 8],
      showMore: true,
      showLess: true,
    });
  });

  it('should show no more once the only page is shown', () => {
    const reveal = revealComments({
      pages: [page(1, 10)],
      step: 1,
      hasNextPage: false,
    });

    expect(reveal.showMore).toBe(false);
  });

  it('should keep more while a loaded page is still hidden', () => {
    const reveal = revealComments({
      pages: [page(1, 10), page(11, 10)],
      step: 1,
      hasNextPage: false,
    });

    expect(toIds(reveal)).toEqual({
      ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      showMore: true,
      showLess: true,
    });
  });

  it('should show each loaded page up to the step, dropping repeats', () => {
    const reveal = revealComments({
      pages: [page(1, 4), [...page(4, 1), ...page(11, 2)]],
      step: 2,
      hasNextPage: false,
    });

    expect(toIds(reveal)).toEqual({
      ids: [1, 2, 3, 4, 11, 12],
      showMore: false,
      showLess: true,
    });
  });

  it('should show every loaded page and keep more while the next page is missing', () => {
    const reveal = revealComments({
      pages: [page(1, 10)],
      step: 2,
      hasNextPage: true,
    });

    expect(toIds(reveal)).toEqual({
      ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      showMore: true,
      showLess: true,
    });
  });
});
