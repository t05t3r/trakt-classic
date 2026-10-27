import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';

export function toListItemPoster(item: ListItem): MediaEntry['poster'] {
  switch (item.type) {
    case 'movie':
    case 'show':
      return item.entry.poster;
    case 'season':
      return item.entry.season.poster ?? item.entry.show.poster;
    case 'episode':
      // An episode carries only a screenshot, never a poster of its own.
      return item.entry.show.poster;
  }
}
