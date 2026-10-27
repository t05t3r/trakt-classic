import { z } from 'zod';
import type { TargetId } from '../models/TargetId.ts';

const TraktIdsSchema = z.object({ ids: z.object({ trakt: z.number() }) });

export const TargetItemSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('movie'), movie: TraktIdsSchema }),
  z.object({ type: z.literal('show'), show: TraktIdsSchema }),
  z.object({ type: z.literal('season'), season: TraktIdsSchema }),
  z.object({ type: z.literal('episode'), episode: TraktIdsSchema }),
]);
export type TargetItem = z.infer<typeof TargetItemSchema>;

// List and watchlist items carry a top-level entry `id`, so the Target id comes from the item's own type.
export function mapToTargetId(item: TargetItem): TargetId {
  switch (item.type) {
    case 'movie':
      return { type: item.type, id: item.movie.ids.trakt };
    case 'show':
      return { type: item.type, id: item.show.ids.trakt };
    case 'season':
      return { type: item.type, id: item.season.ids.trakt };
    case 'episode':
      return { type: item.type, id: item.episode.ids.trakt };
  }
}
