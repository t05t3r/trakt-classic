export const LIST_TYPES = {
  watchlist: ['movie', 'show', 'season', 'episode'],
  favorites: ['movie', 'show'],
} as const;

export type ListDisplayType =
  (typeof LIST_TYPES)[keyof typeof LIST_TYPES][number];
