import { fetchPageQuery } from '$lib/features/query/fetchPageQuery.ts';
import { episodeSummaryQuery } from '$lib/requests/queries/episode/episodeSummaryQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, fetch }) => {
  const { queryClient } = await parent();

  // The page renders only once both summaries are in, so the server HTML needs both.
  await Promise.all([
    fetchPageQuery({
      queryClient,
      query: episodeSummaryQuery({
        slug: params.slug,
        season: Number(params.season),
        episode: Number(params.episode),
        fetch,
      }),
    }),
    fetchPageQuery({
      queryClient,
      query: showSummaryQuery({ slug: params.slug, fetch }),
    }),
  ]);
};
