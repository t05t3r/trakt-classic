import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { RELATED_LIMIT } from '$lib/requests/RELATED_LIMIT.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { ShowEntrySchema } from '$lib/requests/models/ShowEntry.ts';
import { time } from '$lib/utils/timing/time.ts';

type ShowRelatedParams = { slug: string } & ApiParams;

const showRelatedRequest = ({ fetch, slug }: ShowRelatedParams) =>
  api({ fetch })
    .shows
    .related({
      query: {
        extended: 'full,images',
        limit: RELATED_LIMIT,
        page: 1,
      },
      params: {
        id: slug,
      },
    });

export const showRelatedQuery = defineQuery({
  key: 'showRelated',
  invalidations: [],
  dependencies: (params) => [params.slug],
  request: showRelatedRequest,
  mapper: (response) => response.body.map(mapToShowEntry),
  schema: ShowEntrySchema.array(),
  ttl: time.hours(12),
});
