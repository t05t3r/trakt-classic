import { api, type ApiParams } from '$lib/requests/api.ts';
import type { HiddenMediaRequest } from '@trakt/api';

type RestoreShowParams = {
  body: HiddenMediaRequest;
} & ApiParams;

export function restoreShowRequest(
  { body, fetch, onResponse, signal }: RestoreShowParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .users
    .hidden
    .remove
    .section({
      params: {
        section: 'dropped',
      },
      body,
    })
    .then(() => undefined);
}
