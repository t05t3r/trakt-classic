import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { EpisodeActivityHistory } from '$lib/requests/queries/users/episodeActivityHistoryQuery.ts';
import { dedupe } from '$lib/utils/array/dedupe.ts';

export type ShowPlays = Readonly<{
  type: 'show';
  id?: never;
  key: string;
  watchedAt: Date;
  show: ShowEntry;
}>;

// The API answers newest first, so a show's first Play is its latest.
export function groupPlaysByShow(
  plays: ReadonlyArray<EpisodeActivityHistory>,
): ShowPlays[] {
  return dedupe(({ show }) => show.id, plays).map(({ show, watchedAt }) => ({
    type: 'show',
    key: show.key,
    watchedAt,
    show,
  }));
}
