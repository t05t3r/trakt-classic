import type { EpisodeSquare } from '$lib/features/progress/stores/useShowProgressDetail.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';

export type EpisodeHoverCardProps = {
  show: ShowEntry;
  season: number;
  square: EpisodeSquare;
};
