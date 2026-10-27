import { api, type ApiParams } from '$lib/requests/api.ts';
import type { FavoritesRequest } from '@trakt/api';

type AddToFavoritesParams = {
  body: FavoritesRequest;
} & ApiParams;

export function addToFavoritesRequest(
  { body, fetch, onResponse, signal }: AddToFavoritesParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .favorites
    .add({
      body,
    })
    .then(() => undefined);
}
