import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';

export type ProgressRowCardProps = {
  show: ShowEntry;
  nextEpisode: EpisodeEntry | null;
  // Every aired episode watched: the show's card, whatever the next episode.
  isComplete: boolean;
};
