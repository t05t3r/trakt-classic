import type { WatchedStoreProps } from '$lib/features/media-actions/stores/useWatched.ts';

export const SILO_EPISODE = {
  type: 'episode',
  media: { id: 1, title: 'Silo 1x01', season: 1, number: 1 },
  show: { id: 180770, title: 'Silo' },
} satisfies WatchedStoreProps;
