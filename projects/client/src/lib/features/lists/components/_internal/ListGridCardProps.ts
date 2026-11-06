import type { ListEntry } from '$lib/features/lists/ListEntry.ts';
import type { UserGridCardProps } from '$lib/features/media-card/components/UserGridCardProps.ts';
import type { SortBy } from '$lib/models/SortBy.ts';

export type ListGridCardProps =
  & {
    entry: ListEntry;
    sortBy: SortBy;
    // Whether the card carries its entry's rank badge.
    hasRank?: boolean;
  }
  & Pick<UserGridCardProps, 'card' | 'droppedAt' | 'isFaded' | 'favorite'>;
