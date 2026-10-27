import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';

export type SeasonsBlockProps = {
  show: ShowEntry;
  status: SectionStatus<ReadonlyArray<Season>>;
  progress: ShowProgressDetail | Nil;
  // The regular seasons, numbered above SPECIALS; undefined while unknown.
  count: number | undefined;
};
