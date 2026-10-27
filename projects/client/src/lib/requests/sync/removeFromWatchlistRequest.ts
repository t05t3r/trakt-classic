import { api, type ApiParams } from '$lib/requests/api.ts';
import type { WatchlistRequest } from '@trakt/api';

type RemoveFromWatchlistParams = {
  body: WatchlistRequest;
} & ApiParams;

export function removeFromWatchlistRequest(
  { body, fetch, onResponse, signal }: RemoveFromWatchlistParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .watchlist
    .remove({
      body,
    })
    .then(() => undefined);
}
