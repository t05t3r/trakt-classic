import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { WATCHLIST_INVALIDATIONS } from '$lib/requests/_internal/WATCHLIST_INVALIDATIONS.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { ListItemSchema } from '$lib/requests/models/ListItem.ts';
import { time } from '$lib/utils/timing/time.ts';
import { mapToListItems } from '$lib/requests/queries/users/watchlistQuery.ts';
import { z } from 'zod';

// Enough for three rows of six; the section never asks for a second page.
const WATCHLIST_PREVIEW_LIMIT = 18;

const watchlistPreviewRequest = ({ fetch }: ApiParams) =>
  api({ fetch })
    .sync
    .watchlist
    .get({
      params: { type: 'all', sort_by: 'rank', sort_how: 'asc' },
      query: {
        extended: 'full,images',
        limit: WATCHLIST_PREVIEW_LIMIT,
        page: 1,
      },
    });

export const watchlistPreviewQuery = defineQuery({
  key: 'watchlistPreview',
  invalidations: WATCHLIST_INVALIDATIONS,
  dependencies: [],
  request: watchlistPreviewRequest,
  mapper: (response) => {
    const page = extractPageMeta(response.headers);

    return {
      entries: mapToListItems(response.body),
      itemCount: page.type === 'paginated' ? page.itemCount : undefined,
    };
  },
  schema: z.object({
    entries: ListItemSchema.array(),
    itemCount: z.number().optional(),
  }),
  ttl: time.hours(3),
});
