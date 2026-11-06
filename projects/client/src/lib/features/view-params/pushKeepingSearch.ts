import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import {
  type SearchParamWrite,
  withSearchParams,
} from '$lib/utils/url/withSearchParams.ts';

export function pushKeepingSearch(
  path: `/${string}`,
  write: SearchParamWrite = {},
): Promise<void> {
  const { search } = withSearchParams({
    url: page.url,
    params: { ...write, page: null },
  });

  // Callers fire and forget, so a failed push settles quietly.
  return goto(resolve(`${path}${search}`), { keepFocus: true }).catch(NOOP_FN);
}
