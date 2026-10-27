import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';

export type LazyImageProps = {
  src: ImageUrl | Nil;
  alt: string;
  kind: 'poster' | 'fanart' | 'avatar';
  loading?: 'lazy' | 'eager';
  animate?: boolean;
};
