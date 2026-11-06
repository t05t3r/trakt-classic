import type { MediaCardInput } from '$lib/features/media-card/toMediaCard.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';

export function toCardInput(item: ListItem | MediaCardInput): MediaCardInput {
  if (!('entry' in item)) return item;

  switch (item.type) {
    case 'movie':
      return { type: 'movie', movie: item.entry };
    case 'show':
      return { type: 'show', show: item.entry };
    case 'season':
      return { type: 'season', ...item.entry };
    case 'episode':
      return { type: 'episode', ...item.entry };
  }
}
