import {
  HISTORY_ITEM_TYPES,
  type HistoryItem,
  type HistoryItemType,
} from '$lib/features/history/HISTORY_ITEM_TYPES.ts';

export function toHistoryItem(
  values: Readonly<Record<HistoryItemType, string | null>>,
): HistoryItem | null {
  const type = HISTORY_ITEM_TYPES.find((key) => values[key] !== null);

  return type ? { type, id: Number(values[type]) } : null;
}
