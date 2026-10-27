import { mapToAuthData } from '$lib/features/auth/mapToAuthData.ts';
import { redirectForAudience } from '$lib/features/auth/redirectForAudience.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (
  { locals, url, setHeaders, untrack },
) => {
  redirectForAudience({
    audience: 'authenticated',
    session: locals.auth,
    sessionEnded: locals.sessionEnded,
    // A tracked URL read would rerun this load on every path or search change.
    pathAndSearch: untrack(() => `${url.pathname}${url.search}`),
  });
  setHeaders({ 'cache-control': 'private, no-store' });
  return { auth: mapToAuthData(locals.auth) };
};
