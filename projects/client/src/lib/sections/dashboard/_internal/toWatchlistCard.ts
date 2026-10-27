import {
  type MediaCard,
  type MediaCardInput,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
import { toListItemPoster } from './toListItemPoster.ts';

export type WatchlistCard = MediaCard & {
  poster: MediaEntry['poster'];
  posterTitle: string;
  episodeType?: EpisodeType;
};

type WatchlistParts = {
  input: MediaCardInput;
  posterTitle: string;
  episodeType?: EpisodeType;
};

function toWatchlistParts(item: ListItem): WatchlistParts {
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

export function toWatchlistCard(item: ListItem): WatchlistCard {
  const { input, posterTitle, episodeType } = toWatchlistParts(item);

  return {
    ...toMediaCard(input),
    poster: toListItemPoster(item),
    posterTitle,
    ...(episodeType !== undefined && { episodeType }),
  };
}
