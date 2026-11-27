import type { SeasonProgress } from '$lib/requests/models/ShowProgressDetail.ts';

export type SeasonHoverProps = {
  season: SeasonProgress;
  // The row's next episode, given only to the season that holds it.
  upNext?: { season: number; number: number };
};
