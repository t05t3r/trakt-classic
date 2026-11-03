import type { MediaCardInput } from '$lib/features/media-card/toMediaCard.ts';
import type { FavoritedEntry } from '$lib/requests/models/FavoritedEntry.ts';

export type FavoritedInput = Extract<
  MediaCardInput,
  { type: 'movie' | 'show' }
>;

// Only a show carries a total runtime, so it tells the two apart.
export function toFavoritedInput({ item }: FavoritedEntry): FavoritedInput {
  return 'totalRuntime' in item
    ? { type: 'show', show: item }
    : { type: 'movie', movie: item };
}
