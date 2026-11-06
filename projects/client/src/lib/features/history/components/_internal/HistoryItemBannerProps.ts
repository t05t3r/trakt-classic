import type { HistoryItem } from '$lib/features/history/HISTORY_ITEM_TYPES.ts';
import type { HistoryEntry } from '$lib/features/history/stores/useHistoryItems.ts';

export type HistoryItemBannerProps = {
  item: HistoryItem;
  // The list's first entry, which names the title: none while it loads, when it fails or on an empty list.
  // Keyed by the item at the caller, since the banner holds the last entry it was given.
  entry: HistoryEntry | undefined;
  isEmpty: boolean;
  onClear: () => void;
};
