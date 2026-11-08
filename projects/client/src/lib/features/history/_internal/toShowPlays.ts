import type { ShowPlays } from '$lib/features/history/_internal/groupPlaysByShow.ts';
import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import { dedupe } from '$lib/utils/array/dedupe.ts';

// Sorted here: the route's default order isn't by date, and its activity sort sends a rewatched show to the end.
export function toShowPlays(
  rows: ReadonlyArray<WatchedShowProgress>,
): ShowPlays[] {
  const plays = rows
    .map(({ show, watchedAt }) => ({
      type: 'show' as const,
      key: show.key,
      watchedAt,
      show,
    }))
    .toSorted((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());

  // A show that moves between two page reads comes twice, and has one card.
  return dedupe(({ show }) => show.id, plays);
}
