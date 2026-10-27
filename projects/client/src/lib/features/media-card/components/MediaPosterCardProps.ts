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
    badges?: Snippet;
    progress?: Snippet;
  }
  & PosterCardSubtitles;
