import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { time } from '$lib/utils/timing/time.ts';
import { mapToMediaListSummary } from '$lib/requests/_internal/mapToMediaListSummary.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MediaListSummarySchema } from '$lib/requests/models/MediaListSummary.ts';

type ListSummaryParams = { listId: string } & ApiParams;

const listSummaryRequest = (
  { fetch, listId }: ListSummaryParams,
) =>
  api({ fetch })
    .lists
    .summary({
      params: {
        id: listId,
      },
    });

export const listSummaryQuery = defineQuery({
  key: 'listSummary',
  invalidations: [InvalidateAction.List.Like, InvalidateAction.Listed],
  dependencies: (params) => [params.listId],
  request: listSummaryRequest,
  mapper: (response) => mapToMediaListSummary(response.body),
  schema: MediaListSummarySchema,
  ttl: time.minutes(30),
});
