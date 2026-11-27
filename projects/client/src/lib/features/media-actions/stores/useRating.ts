import { currentUserRatingsQuery } from '$lib/features/auth/queries/currentUserRatingsQuery.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import { addRatingRequest } from '$lib/requests/sync/addRatingRequest.ts';
import { removeRatingRequest } from '$lib/requests/sync/removeRatingRequest.ts';
import { toAddRatingsPayload } from '$lib/requests/sync/toAddRatingsPayload.ts';
import { toRemoveRatingsPayload } from '$lib/requests/sync/toRemoveRatingsPayload.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';
import { withPendingOverride } from '../_internal/withPendingOverride.ts';

const READER_KEY = currentUserRatingsQuery().queryKey;

export type RatingStoreProps = {
  type: TargetMediaType;
  id: number;
};

export function useRating({ type, id }: RatingStoreProps) {
  const key = { action: 'rating', targetKey: toTargetKey(type, id) } as const;
  const { ratings } = useUser();
  const write = useOptimisticWrite().bind({
    keys: [key],
    invalidation: InvalidateAction.Rated(type),
    keepUntil: [READER_KEY],
  });
  const { value: rating, isUpdating } = withPendingOverride({
    key,
    snapshot: ratings,
    fromSnapshot: ($ratings) =>
      $ratings?.[`${type}s` as const].get(id)?.rating ?? null,
    fromOverride: (value) => typeof value === 'number' ? value : null,
  });

  const rate = (value: number) =>
    write({
      value,
      task: (params) =>
        addRatingRequest({
          body: toAddRatingsPayload(type, [{ id, rating: value }]),
          ...params,
        }),
    });

  const remove = () =>
    write({
      value: null,
      task: (params) =>
        removeRatingRequest({
          body: toRemoveRatingsPayload(type, [id]),
          ...params,
        }),
    });

  return { rating, isUpdating, rate, remove };
}
