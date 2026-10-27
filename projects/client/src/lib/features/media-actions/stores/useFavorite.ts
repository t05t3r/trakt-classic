import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaType } from '$lib/requests/models/MediaType.ts';
import { addToFavoritesRequest } from '$lib/requests/sync/addToFavoritesRequest.ts';
import { removeFromFavoritesRequest } from '$lib/requests/sync/removeFromFavoritesRequest.ts';
import { toBulkPayload } from '$lib/requests/sync/toBulkPayload.ts';
import { combineLatest, map } from 'rxjs';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';

export type FavoriteStoreProps = {
  type: MediaType;
  id: number;
};

export function useFavorite({ type, id }: FavoriteStoreProps) {
  const key = { action: 'favorite', targetKey: toTargetKey(type, id) } as const;
  const body = toBulkPayload(type, [id]);
  const invalidation = InvalidateAction.Favorited(type);
  const { favorites } = useUser();
  const { run } = useOptimisticWrite();
  const override$ = pendingOverrides.lookup$(key);

  const isFavorite = combineLatest([favorites, override$]).pipe(
    map(([$favorites, override]) => {
      if (override) return override.value === true;

      return $favorites?.[`${type}s` as const].has(id);
    }),
  );

  const isUpdating = override$.pipe(map((override) => override !== undefined));

  const favoritedAt = favorites.pipe(
    map(($favorites) => $favorites?.[`${type}s` as const].get(id)?.favoritedAt),
  );

  const add = () =>
    run({
      keys: [key],
      value: true,
      task: (params) => addToFavoritesRequest({ body, ...params }),
      invalidation,
    });

  const remove = () =>
    run({
      keys: [key],
      value: false,
      task: (params) => removeFromFavoritesRequest({ body, ...params }),
      invalidation,
    });

  return { isFavorite, isUpdating, favoritedAt, add, remove };
}
