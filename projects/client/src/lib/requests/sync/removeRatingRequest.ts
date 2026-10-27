import { api, type ApiParams } from '$lib/requests/api.ts';
import type { RemoveRatingsParams } from '@trakt/api';

type RemoveRatingParams = {
  body: RemoveRatingsParams;
} & ApiParams;

export function removeRatingRequest(
  { body, fetch, onResponse, signal }: RemoveRatingParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .ratings
    .remove({
      body,
    })
    .then(() => undefined);
}
