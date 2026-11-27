import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';

export type LastWatchedPillProps = {
  row: WatchedShowProgress;
  // Without a hidden season's watch, which the row's own date may be.
  lastWatchedAt: Date | null;
};
