import type { WatchedStoreProps } from '$lib/features/media-actions/stores/useWatched.ts';

export const UNWATCHED_MOVIE = {
  type: 'movie',
  media: { id: 999_999, title: 'Unwatched' },
} satisfies WatchedStoreProps;
