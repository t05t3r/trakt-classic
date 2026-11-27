import {
  type MediaCard,
  type MediaCardInput,
  toMediaCard,
} from '$lib/features/media-card/toMediaCard.ts';
import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
import { toCardInput } from './_internal/toCardInput.ts';
import { toEpisodeScreenshot } from './toEpisodeScreenshot.ts';
import { toListItemPoster } from './toListItemPoster.ts';

export type ListItemCard = MediaCard & {
  poster: MediaEntry['poster'];
  posterTitle: string;
  // An episode's own art, for a list that draws wide cards.
  screenshot?: ReturnType<typeof toEpisodeScreenshot>;
  episodeType?: EpisodeType;
};

export function toListItemCard(item: ListItem | MediaCardInput): ListItemCard {
  const input = toCardInput(item);

  return {
    ...toMediaCard(input),
    poster: toListItemPoster(input),
    // A season or an episode is named by its show.
    posterTitle: input.type === 'movie' ? input.movie.title : input.show.title,
    ...(input.type === 'episode' && {
      screenshot: toEpisodeScreenshot(input),
      episodeType: input.episode.type,
    }),
  };
}
