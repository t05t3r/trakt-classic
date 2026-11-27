import type { useHiddenSeasons } from '$lib/features/media-actions/stores/useHiddenSeasons.ts';
import type { SeasonRef } from '$lib/requests/models/ShowProgressDetail.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { SeasonExpansion } from './toggleSeasonExpansion.ts';

export type SeasonsListProps = {
  show: ShowEntry;
  describedBy?: string;
  expansion: SeasonExpansion;
  onexpansion: (next: SeasonExpansion) => void;
  // What the list reads of the box's own store; a hide goes through `onhide`.
  hidden: Pick<
    ReturnType<typeof useHiddenSeasons>,
    'hiddenSeasons' | 'unhiding' | 'isUpdating' | 'unhide'
  >;
  onhide: (
    press: {
      seasons: ReadonlyArray<SeasonRef>;
      // The pressed menu's, which leaves when its own season is hidden.
      trigger: HTMLElement | undefined;
    },
  ) => void;
  showsHidden: boolean;
};
