import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
import { toCardInput } from './_internal/toCardInput.ts';
import type { MediaCardInput } from './toMediaCard.ts';

export function toListItemPoster(
  item: ListItem | MediaCardInput,
): MediaEntry['poster'] {
  const input = toCardInput(item);

  switch (input.type) {
    case 'movie':
      return input.movie.poster;
    case 'show':
      return input.show.poster;
    case 'season':
      return input.season.poster ?? input.show.poster;
    case 'episode':
      // An episode carries only a screenshot, never a poster of its own.
      return input.show.poster;
  }
}
