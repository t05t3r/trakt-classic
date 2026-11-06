import type { HistoryEntry } from '$lib/features/history/stores/useHistoryItems.ts';
import {
  type ListItemCard,
  toListItemCard,
} from '$lib/features/media-card/toListItemCard.ts';

export function toHistoryCard(play: HistoryEntry): ListItemCard {
  // A play proves the item was out by then, whatever its air date reads.
  return toListItemCard({ ...play, playedAt: play.watchedAt });
}
