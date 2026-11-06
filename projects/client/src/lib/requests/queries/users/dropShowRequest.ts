import { api, type ApiParams } from '$lib/requests/api.ts';
import type { DropPayload } from '$lib/requests/sync/toDropPayload.ts';
import type { HiddenMediaRequest } from '@trakt/api';

type DropShowRequest = {
  body: HiddenMediaRequest | DropPayload;
} & ApiParams;

export function dropShowRequest(
  { body, fetch, onResponse, signal }: DropShowRequest,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .users
    .hidden
    .add({
      params: {
        section: 'dropped',
      },
      body,
    })
    .then(() => undefined);
}
