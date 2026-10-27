import { fetchPageQuery } from '$lib/features/query/fetchPageQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, fetch }) => {
  const { queryClient } = await parent();

  await fetchPageQuery({
    queryClient,
    query: showSummaryQuery({ slug: params.slug, fetch }),
  });
};
