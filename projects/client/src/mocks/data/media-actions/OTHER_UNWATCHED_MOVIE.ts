import type { WatchedStoreProps } from '$lib/features/media-actions/stores/useWatched.ts';

export const OTHER_UNWATCHED_MOVIE = {
  type: 'movie',
  media: { id: 999_998, title: 'Other unwatched' },
} satisfies WatchedStoreProps;
