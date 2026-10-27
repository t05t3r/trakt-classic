import { api, type ApiParams } from '$lib/requests/api.ts';
import type { HistoryAddRequest } from '@trakt/api';

type MarkAsWatchedParams = {
  body: HistoryAddRequest;
} & ApiParams;

export function markAsWatchedRequest(
  { body, fetch, onResponse, signal }: MarkAsWatchedParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .history
    .add({
      body,
    })
    .then(() => undefined);
}
