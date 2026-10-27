import { fetchPageQuery } from '$lib/features/query/fetchPageQuery.ts';
import { showSeasonSummaryQuery } from '$lib/requests/queries/shows/showSeasonSummaryQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, fetch }) => {
  const { queryClient } = await parent();

  // The page renders only once both summaries are in, so the server HTML needs both.
  await Promise.all([
    fetchPageQuery({
      queryClient,
      query: showSeasonSummaryQuery({
        slug: params.slug,
        season: Number(params.season),
        fetch,
      }),
    }),
    fetchPageQuery({
      queryClient,
      query: showSummaryQuery({ slug: params.slug, fetch }),
    }),
  ]);
};
