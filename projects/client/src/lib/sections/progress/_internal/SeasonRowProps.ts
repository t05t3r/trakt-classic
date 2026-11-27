import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { Snippet } from 'svelte';
import type { ListedSeason } from './toListedSeasons.ts';

export type SeasonRowProps = {
  row: ListedSeason;
  show: ShowEntry;
  isExpanded: boolean;
  // The id of the season's episodes list, which the toggle opens and closes.
  controls: string;
  ontoggle: () => void;
  // Drawn after the season's label.
  menu?: Snippet;
};
