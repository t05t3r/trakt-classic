import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';

type StartShowRewatchingParams = {
  id: number | string;
} & ApiParams;

export function startShowRewatchingRequest(
  { fetch, id }: StartShowRewatchingParams,
): Promise<boolean> {
  const resetAt = new Date(Date.now() - time.minutes(3)).toISOString();

  return api({ fetch })
    .shows
    .progress
    .reset({ params: { id: `${id}` }, body: { reset_at: resetAt } })
    .then(({ status }) => status >= 200 && status < 300);
}
