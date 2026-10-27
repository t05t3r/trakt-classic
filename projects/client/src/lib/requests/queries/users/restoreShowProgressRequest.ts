import { api, type ApiParams } from '$lib/requests/api.ts';
import type { HiddenMediaRequest } from '@trakt/api';

type RestoreShowRequest = {
  body: HiddenMediaRequest;
} & ApiParams;

export function restoreShowProgressRequest(
  { body, fetch, onResponse, signal }: RestoreShowRequest,
): Promise<boolean> {
  return api({ fetch, onResponse, signal })
    .users
    .hidden
    .remove
    .progress({
      body,
    })
    .then(({ status }) => status === 200);
}
