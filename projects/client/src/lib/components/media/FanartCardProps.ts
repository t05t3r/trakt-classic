import type { Pathname } from '$app/types';
import type { Snippet } from 'svelte';
import type { PosterCardMedia } from './PosterCardProps.ts';

export type FanartCardMedia = Extract<
  PosterCardMedia,
  { type: 'movie' | 'show' | 'episode' }
>;

export type FanartCardProps = {
  media: FanartCardMedia;
  href: Pathname;
  // Links an episode's show name, which is plain text without it.
  showHref?: Pathname;
  image: Snippet;
  // The tag line above the titles.
  caption?: Snippet;
  badges?: Snippet;
  actions?: Snippet;
  // An episode's show line: 'never' where the show is already known, 'phone' below 768px only.
  showLine?: 'always' | 'phone' | 'never';
  // 'phone' shows the titles over the art below 768px only, for a caller that sets them beside the card.
  titles?: 'always' | 'phone';
};
