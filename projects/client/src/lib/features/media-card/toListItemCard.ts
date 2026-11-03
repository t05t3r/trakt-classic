import {
  type MediaCard,
  type MediaCardInput,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
import { toListItemPoster } from './toListItemPoster.ts';

export type ListItemCard = MediaCard & {
  poster: MediaEntry['poster'];
  posterTitle: string;
  episodeType?: EpisodeType;
};

type ListItemParts = {
  input: MediaCardInput;
  posterTitle: string;
  episodeType?: EpisodeType;
};

function toListItemParts(item: ListItem): ListItemParts {
  switch (item.type) {
    case 'movie':
      return {
        input: { type: 'movie', movie: item.entry },
        posterTitle: item.entry.title,
      };
    case 'show':
      return {
        input: { type: 'show', show: item.entry },
        posterTitle: item.entry.title,
      };
    // A season or an episode is named by its show.
    case 'season':
      return {
        input: { type: 'season', ...item.entry },
        posterTitle: item.entry.show.title,
      };
    case 'episode':
      return {
        input: { type: 'episode', ...item.entry },
        posterTitle: item.entry.show.title,
        episodeType: item.entry.episode.type,
      };
  }
}

export function toListItemCard(item: ListItem): ListItemCard {
  const { input, posterTitle, episodeType } = toListItemParts(item);

  return {
    ...toMediaCard(input),
    poster: toListItemPoster(item),
    posterTitle,
    ...(episodeType !== undefined && { episodeType }),
  };
}
