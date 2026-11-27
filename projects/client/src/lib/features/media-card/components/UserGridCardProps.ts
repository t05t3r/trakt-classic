import type { Pathname } from '$app/types';
import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
import type { ListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import type { Snippet } from 'svelte';
import type { MediaPosterCardProps } from './MediaPosterCardProps.ts';

export type UserGridCardProps =
  & { card: ListItemCard; isFaded: boolean }
  & Pick<
    MediaPosterCardProps,
    | 'droppedAt'
    | 'rank'
    | 'favorite'
    | 'historyId'
    | 'playedAt'
    | 'hasPlay'
    | 'tooltipLine'
  >
  & (
    | (PosterCardSubtitles & { art?: never })
    // An episode card draws its screenshot and its show line, which leaves it one line.
    | {
      art?: 'fanart';
      showHref?: Pathname;
      showLead?: never;
      subtitle?: never;
      lines?: readonly [Snippet | undefined];
    }
  );
