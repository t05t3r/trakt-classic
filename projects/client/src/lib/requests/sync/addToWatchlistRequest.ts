import { api, type ApiParams } from '$lib/requests/api.ts';
import type { WatchlistRequest } from '@trakt/api';

type AddToWatchlistParams = {
  body: WatchlistRequest;
} & ApiParams;

export function addToWatchlistRequest(
  { body, fetch, onResponse, signal }: AddToWatchlistParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .watchlist
    .add({
      body,
    })
    .then(() => undefined);
}
