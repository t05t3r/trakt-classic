import { api, type ApiParams } from '$lib/requests/api.ts';
import type { HistoryRemoveRequest } from '@trakt/api';

type RemoveWatchedParams = {
  body: HistoryRemoveRequest;
} & ApiParams;

export function removeWatchedRequest(
  { body, fetch, onResponse, signal }: RemoveWatchedParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .history
    .remove({
      body,
    })
    .then(() => undefined);
}
