import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import { toCardInput } from './_internal/toCardInput.ts';
import type { MediaCardInput } from './toMediaCard.ts';

// A season or an episode shows its show's fanart.
export function toListItemCover(item: ListItem | MediaCardInput): ImageUrl {
  const input = toCardInput(item);

  return input.type === 'movie'
    ? input.movie.cover.url.full
    : input.show.cover.url.full;
}
