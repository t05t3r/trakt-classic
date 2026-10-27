import { fetchPageQuery } from '$lib/features/query/fetchPageQuery.ts';
import { movieSummaryQuery } from '$lib/requests/queries/movies/movieSummaryQuery.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, fetch }) => {
  const { queryClient } = await parent();

  await fetchPageQuery({
    queryClient,
    query: movieSummaryQuery({ slug: params.slug, fetch }),
  });
};
