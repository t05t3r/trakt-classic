import type { FanartCardProps } from '$lib/components/media/FanartCardProps.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';

export type EpisodeFanartCardProps = {
  show: ShowEntry;
  episode: EpisodeEntry;
  // Adds the air time to the caption, after the episode's type.
  withAirDate?: boolean;
  titles?: FanartCardProps['titles'];
};
