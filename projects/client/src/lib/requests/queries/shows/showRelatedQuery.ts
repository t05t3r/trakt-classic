import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { ShowEntrySchema } from '$lib/requests/models/ShowEntry.ts';
import { time } from '$lib/utils/timing/time.ts';

// One row of six; the block never asks for a second page.
const RELATED_LIMIT = 6;

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
