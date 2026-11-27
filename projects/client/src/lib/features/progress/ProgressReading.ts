import type { MediaCard } from '$lib/features/media-card/toMediaCard.ts';
import type { PagedReading } from '$lib/features/paging/stores/usePagedItems.ts';
import type { ProgressStats } from '$lib/features/progress/sumProgressStats.ts';
import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';

export type ProgressListEntry =
  & WatchedShowProgress
  & Readonly<{ hiddenAt?: Date }>;

export type ProgressReading =
  & PagedReading<ProgressListEntry, MediaCard<'show'>>
  & Readonly<{ stats: ProgressStats | undefined }>;
