import { api, type ApiParams } from '$lib/requests/api.ts';
import type { RatingsSyncRequest } from '@trakt/api';

type AddRatingParams = {
  body: RatingsSyncRequest;
} & ApiParams;

export function addRatingRequest(
  { body, fetch, onResponse, signal }: AddRatingParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .sync
    .ratings
    .add({
      body,
    })
    .then(() => undefined);
}
