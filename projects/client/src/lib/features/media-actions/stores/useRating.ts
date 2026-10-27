import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import { addRatingRequest } from '$lib/requests/sync/addRatingRequest.ts';
import { removeRatingRequest } from '$lib/requests/sync/removeRatingRequest.ts';
import { toAddRatingsPayload } from '$lib/requests/sync/toAddRatingsPayload.ts';
import { toRemoveRatingsPayload } from '$lib/requests/sync/toRemoveRatingsPayload.ts';
import { combineLatest, map } from 'rxjs';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';

export type RatingStoreProps = {
  type: TargetMediaType;
  id: number;
};

export function useRating({ type, id }: RatingStoreProps) {
  const key = { action: 'rating', targetKey: toTargetKey(type, id) } as const;
  const invalidation = InvalidateAction.Rated(type);
  const { ratings } = useUser();
  const { run } = useOptimisticWrite();
  const override$ = pendingOverrides.lookup$(key);

  const rating = combineLatest([ratings, override$]).pipe(
    map(([$ratings, override]) => {
      if (override) {
        return typeof override.value === 'number' ? override.value : null;
      }

      return $ratings?.[`${type}s` as const].get(id)?.rating ?? null;
    }),
  );

  const isUpdating = override$.pipe(map((override) => override !== undefined));

  const rate = (value: number) =>
    run({
      keys: [key],
      value,
      task: (params) =>
        addRatingRequest({
          body: toAddRatingsPayload(type, [{ id, rating: value }]),
          ...params,
        }),
      invalidation,
    });

  const remove = () =>
    run({
      keys: [key],
      value: null,
      task: (params) =>
        removeRatingRequest({
          body: toRemoveRatingsPayload(type, [id]),
          ...params,
        }),
      invalidation,
    });

  return { rating, isUpdating, rate, remove };
}
