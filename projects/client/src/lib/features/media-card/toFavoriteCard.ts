import type { FavoritedEntry } from '$lib/requests/models/FavoritedEntry.ts';
import { toFavoritedInput } from './toFavoritedInput.ts';
import { type ListItemCard, toListItemCard } from './toListItemCard.ts';

export function toFavoriteCard(entry: FavoritedEntry): ListItemCard {
  return toListItemCard(toFavoritedInput(entry));
}
