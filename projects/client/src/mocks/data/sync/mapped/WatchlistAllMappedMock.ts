import type { WatchlistedTarget } from '$lib/features/auth/queries/currentUserWatchlistQuery.ts';

export const WatchlistAllMappedMock: WatchlistedTarget[] = [
  { type: 'movie', id: 481, listedAt: new Date('2024-01-01T12:00:00.000Z') },
  {
    type: 'show',
    id: 180770,
    listedAt: new Date('2024-01-02T12:00:00.000Z'),
  },
  {
    type: 'season',
    id: 257490,
    listedAt: new Date('2024-01-03T12:00:00.000Z'),
  },
  {
    type: 'episode',
    id: 5165667,
    listedAt: new Date('2024-01-04T12:00:00.000Z'),
  },
];
