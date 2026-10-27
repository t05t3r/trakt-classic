import { api, type ApiParams } from '$lib/requests/api.ts';
import type { FavoritesRequest } from '@trakt/api';

type RemoveFromFavoritesParams = {
  body: FavoritesRequest;
} & ApiParams;

export function removeFromFavoritesRequest(
  { body, fetch, onResponse, signal }: RemoveFromFavoritesParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .favorites
    .remove({
      body,
    })
    .then(() => undefined);
}
