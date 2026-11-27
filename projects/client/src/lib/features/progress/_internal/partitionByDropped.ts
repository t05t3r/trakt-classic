import type { UserDropped } from '$lib/features/auth/stores/useUser.ts';
import type { PendingDropLookup } from '$lib/features/media-actions/stores/usePendingDrops.ts';

type PartitionByDroppedParams<T> = {
  rows: ReadonlyArray<T>;
  dropped: UserDropped;
  isPending: PendingDropLookup;
};

export type DroppedPartition<T> = Readonly<{
  watched: ReadonlyArray<T>;
  dropped: ReadonlyArray<T & { hiddenAt: Date }>;
}>;

export function partitionByDropped<T extends { show: { id: number } }>(
  { rows, dropped, isPending }: PartitionByDroppedParams<T>,
): DroppedPartition<T> {
  const isDropped = ({ show }: T) =>
    isPending(show.id) ?? dropped.shows.has(show.id);

  // A pending or kept Drop has no date until the Snapshot holds it, so it waits outside both lists.
  const withHiddenAt = (row: T) => {
    const hiddenAt = dropped.shows.get(row.show.id);

    return hiddenAt === undefined ? [] : [{ ...row, hiddenAt }];
  };

  const byDropped = Map.groupBy(rows, isDropped);

  return {
    watched: byDropped.get(false) ?? [],
    dropped: (byDropped.get(true) ?? []).flatMap(withHiddenAt),
  };
}
