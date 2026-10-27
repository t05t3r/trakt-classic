import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';

export type EpisodesBlockProps = {
  show: ShowEntry;
  status: SectionStatus<EpisodeEntry[]>;
  // The season's episodes, however many the filter hides; undefined while unknown.
  count: number | undefined;
};
