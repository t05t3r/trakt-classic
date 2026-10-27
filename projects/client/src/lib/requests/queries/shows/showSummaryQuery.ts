import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import { ShowEntrySchema } from '$lib/requests/models/ShowEntry.ts';

type ShowSummaryParams = { slug: string } & ApiParams;

const showSummaryRequest = (
  { fetch, slug }: ShowSummaryParams,
) =>
  // Unauthenticated, so the browser's request matches the server render's and reuses its response.
  api({ fetch, authenticated: false })
    .shows
    .summary({
      params: {
        id: slug,
      },
      query: {
        extended: 'full,images',
      },
    });

export const showSummaryQuery = defineQuery({
  key: 'showSummary:v2',
  invalidations: [],
  dependencies: (params) => [params.slug],
  request: showSummaryRequest,
  mapper: (response) => mapToShowEntry(response.body),
  schema: ShowEntrySchema,
  ttl: time.hours(3),
});
