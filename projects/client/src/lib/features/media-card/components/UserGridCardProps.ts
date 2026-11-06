import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
import type { ListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import type { MediaPosterCardProps } from './MediaPosterCardProps.ts';

export type UserGridCardProps =
  & { card: ListItemCard; isFaded: boolean }
  & Pick<
    MediaPosterCardProps,
    | 'fanart'
    | 'droppedAt'
    | 'rank'
    | 'favorite'
    | 'historyId'
    | 'playedAt'
    | 'hasPlay'
  >
  & PosterCardSubtitles;
