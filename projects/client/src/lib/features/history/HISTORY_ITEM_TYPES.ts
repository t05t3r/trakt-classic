// In the order the page reads them, so a URL with two keys reads the earlier one.
export const HISTORY_ITEM_TYPES = [
  'movie',
  'episode',
  'show',
  'season',
] as const;

export type HistoryItemType = (typeof HISTORY_ITEM_TYPES)[number];

export type HistoryItem = Readonly<{ type: HistoryItemType; id: number }>;
