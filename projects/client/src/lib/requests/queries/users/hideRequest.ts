import { api, type ApiParams } from '$lib/requests/api.ts';
import type { HiddenMediaRequest } from '@trakt/api';

type HideParams = {
  section: 'dropped' | 'progress_watched';
  mode: 'add' | 'remove';
  body: HiddenMediaRequest;
} & ApiParams;

export function hideRequest(
  { section, mode, body, fetch, onResponse, signal }: HideParams,
): Promise<void> {
  const hidden = api({ fetch, onResponse, signal }).users.hidden;
  const request = { params: { section }, body };
  const response = mode === 'add'
    ? hidden.add(request)
    : hidden.remove.section(request);

  return response.then(() => undefined);
}
