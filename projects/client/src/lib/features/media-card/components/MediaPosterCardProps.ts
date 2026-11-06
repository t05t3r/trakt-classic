import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
import type { Snippet } from 'svelte';

export type MediaPosterCardProps =
  & {
    card: MediaCard;
    poster: MediaEntry['poster'];
    // A season or episode poster is named by its show.
    posterTitle: string;
    // Drawn in the poster's place, for a wide card.
    fanart?: { src: ImageUrl; alt: string };
    // Badged on a show card only, and only for a date Trakt gave.
    droppedAt?: Date;
    rank?: number;
    // Read once, when the strip is made, as `QuickActions` reads it.
    favorite?: boolean;
    // A Play's own card, read as `QuickActions` reads it.
    historyId?: number;
    // When that Play was watched, read as `QuickActions` reads it.
    playedAt?: Date;
    // The card's media has a Play, read as `QuickActions` reads it.
    hasPlay?: true;
    badges?: Snippet;
    progress?: Snippet;
  }
  & PosterCardSubtitles;
