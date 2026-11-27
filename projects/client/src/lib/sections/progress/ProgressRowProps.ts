import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';

export type ProgressRowProps = {
  row: WatchedShowProgress;
  isFaded?: boolean;
  droppedAt?: Date;
};
