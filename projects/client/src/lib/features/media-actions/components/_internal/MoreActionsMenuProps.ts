import type { HistoryItem } from '$lib/features/history/HISTORY_ITEM_TYPES.ts';

export type MoreActionsMenuProps = {
  target: HistoryItem;
  hasHistory: boolean;
  // Each given, its row shows.
  onDrop?: () => unknown;
  onRestore?: () => Promise<unknown>;
};
