import type { Pathname } from '$app/types';
import type { Snippet } from 'svelte';

export type PosterCardMedia =
  | { type: 'movie'; title: string; year?: number }
  | { type: 'show'; title: string }
  | { type: 'season'; show: string; number: number }
  | {
    type: 'episode';
    show: string;
    season: number;
    number: number;
    title: string;
  };

// Each snippet clips its own overflow: the heading around it clips nothing.
export type PosterCardSubtitles =
  | { showHref?: never; showLead?: never; subtitle?: Snippet; lines?: never }
  | {
    showHref?: never;
    showLead?: never;
    subtitle?: never;
    lines?: readonly [Snippet | undefined, Snippet | undefined];
  }
  // The show line, on a season or episode card, takes the first line.
  | {
    showHref?: Pathname;
    showLead?: Snippet;
    subtitle?: never;
    lines?: readonly [Snippet | undefined, undefined];
  };

export type PosterCardProps =
  & {
    media: PosterCardMedia;
    href: Pathname;
    droppedAt?: Date;
    // The quick-icons strip's background, which differs per page.
    strip?: 'recessed' | 'overlay';
    image: Snippet;
    actions?: Snippet;
    badges?: Snippet;
    progress?: Snippet;
  }
  & PosterCardSubtitles;
