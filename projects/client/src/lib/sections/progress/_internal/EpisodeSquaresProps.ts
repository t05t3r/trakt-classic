import type { SeasonProgress } from '$lib/requests/models/ShowProgressDetail.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';

export type EpisodeSquaresProps = {
  show: ShowEntry;
  // A hidden season's progress comes from the read of every season, not the show's own.
  season: SeasonProgress;
};
