import { currentUserFavoritesQuery } from '$lib/features/auth/queries/currentUserFavoritesQuery.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaType } from '$lib/requests/models/MediaType.ts';
import { addToFavoritesRequest } from '$lib/requests/sync/addToFavoritesRequest.ts';
import { removeFromFavoritesRequest } from '$lib/requests/sync/removeFromFavoritesRequest.ts';
import { toBulkPayload } from '$lib/requests/sync/toBulkPayload.ts';
import { map } from 'rxjs';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';
import { withPendingOverride } from '../_internal/withPendingOverride.ts';

const READER_KEY = currentUserFavoritesQuery().queryKey;

export type FavoriteStoreProps = {
  type: MediaType;
  id: number;
};

export function useFavorite({ type, id }: FavoriteStoreProps) {
  const key = { action: 'favorite', targetKey: toTargetKey(type, id) } as const;
  const body = toBulkPayload(type, [id]);
  const { favorites } = useUser();
  const write = useOptimisticWrite().bind({
    keys: [key],
    invalidation: InvalidateAction.Favorited(type),
    keepUntil: [READER_KEY],
  });
  const { value: isFavorite, isUpdating } = withPendingOverride({
    key,
    snapshot: favorites,
    fromSnapshot: ($favorites) => $favorites?.[`${type}s` as const].has(id),
  });

  const favoritedAt = favorites.pipe(
    map(($favorites) => $favorites?.[`${type}s` as const].get(id)?.favoritedAt),
  );

  const add = () =>
    write({
      value: true,
      task: (params) => addToFavoritesRequest({ body, ...params }),
    });

  const remove = () =>
    write({
      value: false,
      task: (params) => removeFromFavoritesRequest({ body, ...params }),
    });

  return { isFavorite, isUpdating, favoritedAt, add, remove };
}
