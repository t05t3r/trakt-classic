import { api, type ApiParams } from '$lib/requests/api.ts';

type StopShowRewatchingParams = {
  id: number | string;
} & ApiParams;

export function stopShowRewatchingRequest(
  { fetch, id }: StopShowRewatchingParams,
): Promise<boolean> {
  return api({ fetch })
    .shows
    .progress
    .undoReset({ params: { id: `${id}` } })
    .then(({ status }) => status >= 200 && status < 300);
}
