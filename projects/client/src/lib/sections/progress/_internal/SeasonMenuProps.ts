import type { SeasonRef } from '$lib/requests/models/ShowProgressDetail.ts';
import type { SeasonsListProps } from './SeasonsListProps.ts';
import type { ListedSeason } from './toListedSeasons.ts';

export type SeasonMenuProps = {
  number: number;
  isHidden: boolean;
  hides: ListedSeason['hides'];
  // A hide or unhide of any of the show's seasons is saving.
  isUpdating: boolean;
  onhide: SeasonsListProps['onhide'];
  onunhide: (seasons: ReadonlyArray<SeasonRef>) => unknown;
};
