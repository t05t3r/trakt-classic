import type { Pathname } from '$app/types';
import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { Snippet } from 'svelte';
import type { InfoSection } from './InfoSection.ts';

export type SummaryPoster = {
  src: ImageUrl;
  href?: Pathname;
  title: string;
  ratingTarget?: RatingStoreProps;
};

export type ExternalLink = {
  key: 'official' | 'imdb' | 'tmdb';
  label: string;
  href: string;
};

export type SummaryInfoProps = {
  poster: SummaryPoster;
  links: ReadonlyArray<ExternalLink>;
  sections: ReadonlyArray<InfoSection>;
  switcher?: Snippet;
};
