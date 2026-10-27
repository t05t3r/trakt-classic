import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { mapToListItem } from '$lib/requests/_internal/mapToListItem.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { ListItemSchema } from '$lib/requests/models/ListItem.ts';
import { time } from '$lib/utils/timing/time.ts';
import { listedAllResponseSchema } from '@trakt/api';
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
  invalidations: [
    InvalidateAction.Watchlisted('movie'),
    InvalidateAction.Watchlisted('show'),
    InvalidateAction.Watchlisted('season'),
    InvalidateAction.Watchlisted('episode'),
    InvalidateAction.MarkAsWatched('movie'),
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
  ],
  dependencies: [],
  request: watchlistPreviewRequest,
  mapper: (response) => {
    const page = extractPageMeta(response.headers);

    return {
      // The SDK types this route's items loosely, so they are parsed here.
      entries: listedAllResponseSchema.array().parse(response.body).map(
        mapToListItem,
      ),
      itemCount: page.type === 'paginated' ? page.itemCount : undefined,
    };
  },
  schema: z.object({
    entries: ListItemSchema.array(),
    itemCount: z.number().optional(),
  }),
  ttl: time.hours(3),
});
