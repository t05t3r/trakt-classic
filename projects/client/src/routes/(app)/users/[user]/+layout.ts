import { currentUserSettingsQuery } from '$lib/features/auth/queries/currentUserSettingsQuery.ts';
import { fetchPageQuery } from '$lib/features/query/fetchPageQuery.ts';
import { SIGNED_IN_ALIAS } from '$lib/utils/url/SIGNED_IN_ALIAS.ts';
import { USER_SEGMENT } from '$lib/utils/url/USER_SEGMENT.ts';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

// The settings read needs the browser's token, which the server never holds.
export const ssr = false;

export const load: LayoutLoad = async (
  { parent, params, url, untrack, fetch },
) => {
  const { queryClient } = await parent();
  const { slug } = await fetchPageQuery({
    queryClient,
    query: currentUserSettingsQuery({ fetch }),
  });

  if (params.user === slug) return;
  if (params.user !== SIGNED_IN_ALIAS) error(404);

  // A tracked URL read would rerun this load on every path or search change.
  const location = untrack(() =>
    `${url.pathname.replace(USER_SEGMENT, `/users/${slug}`)}${url.search}`
  );
  redirect(307, location);
};
