import type { FavoritedEntry } from '$lib/requests/models/FavoritedEntry.ts';
import { toFavoritedInput } from './toFavoritedInput.ts';
import type { ListItemCard } from './toListItemCard.ts';
import { toMediaCard } from './toMediaCard.ts';

export function toFavoriteCard(entry: FavoritedEntry): ListItemCard {
  const { item } = entry;

  return {
    ...toMediaCard(toFavoritedInput(entry)),
    poster: item.poster,
    posterTitle: item.title,
  };
}
