import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { WatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
import { toListItemCover } from '$lib/features/media-card/toListItemCover.ts';
import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
import { toClientPage } from '$lib/features/paging/toClientPage.ts';
import type {
  ProgressListEntry,
  ProgressReading,
} from '$lib/features/progress/ProgressReading.ts';
import { sumProgressStats } from '$lib/features/progress/sumProgressStats.ts';
import { toKnownDate } from '$lib/utils/date/toKnownDate.ts';
import { isProgressComplete } from '$lib/utils/media/isProgressComplete.ts';
import { PROGRESS_PAGE_SIZE } from '$lib/utils/PROGRESS_PAGE_SIZE.ts';

type ToProgressReadingParams = {
  status: SectionStatus<ReadonlyArray<ProgressListEntry>>;
  watched: WatchedFilter | null;
  page: number;
};

function toStats(status: SectionStatus<ReadonlyArray<ProgressListEntry>>) {
  if (status.kind === 'ready') return sumProgressStats(status.data);
  if (status.kind === 'empty') return sumProgressStats([]);

  return undefined;
}

export function toProgressReading(
  { status, watched, page }: ToProgressReadingParams,
): ProgressReading {
  const reading = toClientPage({
    status,
    page,
    pageSize: PROGRESS_PAGE_SIZE,
    toRow: (entry) => ({
      entry,
      card: toMediaCard({ type: 'show', show: entry.show }),
      isFaded: watched === 'fade' && isProgressComplete(entry),
      // A drop with no date comes back as the far-future sentinel, which no row shows.
      droppedAt: toKnownDate(entry.hiddenAt),
    }),
    toCover: ({ show }) => toListItemCover({ type: 'show', show }),
  });

  return { ...reading, stats: toStats(status) };
}
