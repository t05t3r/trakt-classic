import type { WatchlistedTarget } from '$lib/features/auth/queries/currentUserWatchlistQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { WatchlistAllMappedMock } from '$mocks/data/sync/mapped/WatchlistAllMappedMock.ts';

// The date the mapped watchlist gives a Target; throws for one off it.
export function listedAtOf(
  { type, id }: Pick<WatchlistedTarget, 'type' | 'id'>,
): Date {
  return assertDefined(
    WatchlistAllMappedMock.find((entry) =>
      entry.type === type && entry.id === id
    ),
  ).listedAt;
}
