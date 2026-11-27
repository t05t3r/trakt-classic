import { currentUserWatchlistQuery } from '$lib/features/auth/queries/currentUserWatchlistQuery.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import { addToWatchlistRequest } from '$lib/requests/sync/addToWatchlistRequest.ts';
import { removeFromWatchlistRequest } from '$lib/requests/sync/removeFromWatchlistRequest.ts';
import { toBulkPayload } from '$lib/requests/sync/toBulkPayload.ts';
import { map } from 'rxjs';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';
import { useIsWatchlisted } from './_internal/useIsWatchlisted.ts';

const READER_KEY = currentUserWatchlistQuery().queryKey;

export type WatchlistStoreProps = {
  type: TargetMediaType;
  id: number;
};

export function useWatchlist({ type, id }: WatchlistStoreProps) {
  const key = {
    action: 'watchlist',
    targetKey: toTargetKey(type, id),
  } as const;
  const body = toBulkPayload(type, [id]);
  const write = useOptimisticWrite().bind({
    keys: [key],
    invalidation: InvalidateAction.Watchlisted(type),
    keepUntil: [READER_KEY],
  });
  const { isWatchlisted, isUpdating } = useIsWatchlisted({ type, id });
  const { watchlist } = useUser();
  const listedAt = watchlist.pipe(
    map(($watchlist) => $watchlist?.[`${type}s` as const].get(id)),
  );

  const add = () =>
    write({
      value: true,
      task: (params) => addToWatchlistRequest({ body, ...params }),
    });

  const remove = () =>
    write({
      value: false,
      task: (params) => removeFromWatchlistRequest({ body, ...params }),
    });

  return { isWatchlisted, isUpdating, listedAt, add, remove };
}
