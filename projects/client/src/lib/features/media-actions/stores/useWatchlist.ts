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
  const invalidation = InvalidateAction.Watchlisted(type);
  const { run } = useOptimisticWrite();
  const { isWatchlisted, isUpdating } = useIsWatchlisted({ type, id });
  const { watchlist } = useUser();
  const listedAt = watchlist.pipe(
    map(($watchlist) => $watchlist?.[`${type}s` as const].get(id)),
  );

  const add = () =>
    run({
      keys: [key],
      value: true,
      task: (params) => addToWatchlistRequest({ body, ...params }),
      invalidation,
    });

  const remove = () =>
    run({
      keys: [key],
      value: false,
      task: (params) => removeFromWatchlistRequest({ body, ...params }),
      invalidation,
    });

  return { isWatchlisted, isUpdating, listedAt, add, remove };
}
