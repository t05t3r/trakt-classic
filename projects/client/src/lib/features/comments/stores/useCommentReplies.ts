import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import { commentRepliesQuery } from '$lib/requests/queries/comments/commentRepliesQuery.ts';
import { map, type Observable } from 'rxjs';
import { REPLIES_LIMIT } from './REPLIES_LIMIT.ts';

export function useCommentReplies(
  id: number,
): Observable<SectionStatus<ReadonlyArray<MediaComment>>> {
  return useInfiniteQuery(commentRepliesQuery({ id, limit: REPLIES_LIMIT }))
    .pipe(
      map((result) =>
        toSectionStatus({
          result,
          select: ({ pages }) => pages.at(0)?.entries ?? [],
          isEmpty: (replies) => replies.length === 0,
        })
      ),
    );
}
