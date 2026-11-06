export const HISTORY_TYPES = ['movies', 'shows', 'episodes'] as const;

export type HistoryType = (typeof HISTORY_TYPES)[number];
