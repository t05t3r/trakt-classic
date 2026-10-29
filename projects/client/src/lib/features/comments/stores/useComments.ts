import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import type { CommentSortType } from '$lib/requests/models/CommentSortType.ts';
import type { DirectCommentTarget } from '$lib/requests/models/DirectCommentTarget.ts';
import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import { episodeCommentsQuery } from '$lib/requests/queries/episode/episodeCommentsQuery.ts';
import { movieCommentsQuery } from '$lib/requests/queries/movies/movieCommentsQuery.ts';
import { showCommentsQuery } from '$lib/requests/queries/shows/showCommentsQuery.ts';
import { showSeasonCommentsQuery } from '$lib/requests/queries/shows/showSeasonCommentsQuery.ts';
import { multicast } from '$lib/utils/store/multicast.ts';
import { WritableSubject } from '$lib/utils/store/WritableSubject.ts';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
  switchMap,
  take,
} from 'rxjs';
import { COMMENTS_PAGE_SIZE } from '../_internal/COMMENTS_PAGE_SIZE.ts';
import {
  type CommentsReveal,
  revealComments,
} from '../_internal/revealComments.ts';

export type CommentsTarget = Extract<
  DirectCommentTarget,
  { type: 'movie' | 'show' | 'season' | 'episode' }
>;

const RECENT = 'recent';

// Only Recent reaches the URL, so a page's first pane never does.
const SPEC = {
  comments: { values: [RECENT], fallback: null },
};

type CommentsQueryParams = {
  target: CommentsTarget;
  sort: CommentSortType;
};

function commentsQuery({ target, sort }: CommentsQueryParams) {
  const paging = { sort, limit: COMMENTS_PAGE_SIZE };

  switch (target.type) {
    case 'movie':
      return movieCommentsQuery({ slug: target.slug, ...paging });
    case 'show':
      return showCommentsQuery({ slug: target.slug, ...paging });
    case 'season':
      return showSeasonCommentsQuery({
        slug: target.slug,
        season: target.season,
        ...paging,
      });
    case 'episode':
      return episodeCommentsQuery({
        slug: target.slug,
        season: target.season,
        episode: target.episode,
        ...paging,
      });
  }
}

type NextStepParams = {
  pages: ReadonlyArray<ReadonlyArray<MediaComment>>;
  step: number;
};

// A step past every loaded page reveals the next page once it loads.
function nextStep({ pages, step }: NextStepParams): number {
  const countAt = (opened: number) =>
    revealComments({ pages, step: opened, hasNextPage: false }).comments
      .length;
  const shown = countAt(step);
  const later = Array.from(
    { length: pages.length - step },
    (_, index) => step + 1 + index,
  );

  return later.find((opened) => countAt(opened) > shown) ?? pages.length + 1;
}

export function useComments(target: CommentsTarget): {
  sort: Observable<CommentSortType>;
  select(sort: CommentSortType): Promise<void>;
  status: Observable<SectionStatus<CommentsReveal>>;
  more(): void;
  less(): void;
} {
  const { values, set } = useViewParam(SPEC);
  const queries = {
    likes: useInfiniteQuery(commentsQuery({ target, sort: 'likes' })),
    newest: useInfiniteQuery(commentsQuery({ target, sort: 'newest' })),
  };
  const step = new WritableSubject(0);

  const sort = values.pipe(
    map(({ comments }): CommentSortType =>
      comments === RECENT ? 'newest' : 'likes'
    ),
    distinctUntilChanged(),
  );

  // Shared, so a later subscriber does not reset the step.
  const shown = sort.pipe(
    switchMap((key) => {
      // switchMap has left the old pane, so no reading pairs it with step 0.
      step.set(0);
      return combineLatest([queries[key], step]);
    }),
    multicast(),
  );

  return {
    sort,
    select: (key) => set({ comments: key === 'newest' ? RECENT : null }),
    status: shown.pipe(
      map(([result, opened]) =>
        toSectionStatus({
          result,
          select: ({ pages }) =>
            revealComments({
              pages: pages.map(({ entries }) => entries),
              step: opened,
              hasNextPage: result.hasNextPage,
            }),
          isEmpty: ({ comments }) => comments.length === 0,
        })
      ),
    ),
    more: () => {
      shown.pipe(take(1)).subscribe(([result, opened]) => {
        if (result.data === undefined) return;

        const pages = result.data.pages.map(({ entries }) => entries);
        const next = nextStep({ pages, step: opened });
        step.set(next);
        if (next <= pages.length) return;

        if (result.isFetchingNextPage) return;
        // Cancels a refetch of the loaded pages, which a joined call would leave with no next page.
        void result.fetchNextPage();
      });
    },
    less: () => step.set(0),
  };
}
