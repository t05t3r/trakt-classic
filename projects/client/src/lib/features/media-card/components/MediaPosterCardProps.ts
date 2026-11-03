import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
import type { Snippet } from 'svelte';

export type MediaPosterCardProps =
  & {
    card: MediaCard;
    poster: MediaEntry['poster'];
    // A season or episode poster is named by its show.
    posterTitle: string;
    // Badged on a show card only, and only for a date Trakt gave.
    droppedAt?: Date;
    rank?: number;
    // Read once, when the strip is made, as `QuickActions` reads it.
    favorite?: boolean;
    badges?: Snippet;
    progress?: Snippet;
  }
  & PosterCardSubtitles;
