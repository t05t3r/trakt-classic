import type { Pathname } from '$app/types';
import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';

export type MobilePosterProps = {
  poster: ImageUrl;
  href?: Pathname;
  title: string;
  ratingTarget?: RatingStoreProps;
};
