import type { ListEntry } from '$lib/features/lists/ListEntry.ts';
import type { ListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import type { SortBy } from '$lib/models/SortBy.ts';

export type ListGridCardProps = {
  entry: ListEntry;
  card: ListItemCard;
  droppedAt?: Date;
  isFaded: boolean;
  sortBy: SortBy;
  // Whether the card carries its entry's rank badge.
  hasRank?: boolean;
  // Read once, when the card's strip is made.
  favorite?: boolean;
};
