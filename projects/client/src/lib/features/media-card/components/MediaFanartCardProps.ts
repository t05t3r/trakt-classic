import type { FanartCardProps } from '$lib/components/media/FanartCardProps.ts';
import type { QuickActionsProps } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { Snippet } from 'svelte';

export type MediaFanartCardProps = {
  card: MediaCard<'movie' | 'episode' | 'show'>;
  fanart: { src: ImageUrl; alt: string };
  // The tag line above the titles.
  caption?: Snippet;
  // Drawn in the strip in place of its icons.
  status?: QuickActionsProps['status'];
  showLine?: FanartCardProps['showLine'];
  titles?: FanartCardProps['titles'];
  // Read once, when the strip is made, as `QuickActions` reads it.
  favorite?: boolean;
  // A Play's own card, read as `QuickActions` reads it.
  historyId?: number;
  // When that Play was watched, read as `QuickActions` reads it.
  playedAt?: Date;
};
