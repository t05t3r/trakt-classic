import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
import { personalListsQuery } from '$lib/requests/queries/users/personalListsQuery.ts';
import { identity, type Observable } from 'rxjs';

export function usePersonalLists(): Observable<
  ReadonlyArray<MediaListSummary> | undefined
> {
  return useSnapshot(
    personalListsQuery({
      slug: 'me',
      limit: 100,
      sortBy: 'rank',
      sortHow: 'asc',
    }),
    { select: identity, whileUnsettled: 'hold' },
  );
}
