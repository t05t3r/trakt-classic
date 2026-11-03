import type { FavoritedEntry } from '$lib/requests/models/FavoritedEntry.ts';
import type { ListEntry } from '$lib/features/lists/ListEntry.ts';

export function isFavorited(item: ListEntry): item is FavoritedEntry {
  return 'favoritedAt' in item;
}
