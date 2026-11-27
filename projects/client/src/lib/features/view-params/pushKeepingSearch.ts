import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { queueNavigation } from '$lib/features/view-params/queueNavigation.svelte.ts';
import {
  type SearchParamWrite,
  withSearchParams,
} from '$lib/utils/url/withSearchParams.ts';

type Path = `/${string}`;

// A function reads the path inside the queued step, from the state the steps before it left.
type PushPath = Path | (() => Promise<Path | undefined>);

export function pushKeepingSearch(
  path: PushPath,
  write: SearchParamWrite = {},
): Promise<void> {
  const { id } = page.route;

  return queueNavigation(async () => {
    // A late push would pull the user back to the route they left.
    if (page.route.id !== id) return;

    const target = typeof path === 'string' ? path : await path();
    if (target === undefined) return;

    const { search } = withSearchParams({
      url: page.url,
      params: { ...write, page: null },
    });
    return goto(resolve(`${target}${search}`), { keepFocus: true });
  });
}
