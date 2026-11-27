import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { Snippet } from 'svelte';

export type SeasonsBoxProps = {
  show: ShowEntry;
  // The id of the row's title, which tells one row's seasons from another's.
  describedBy?: string;
  // The row's cell that holds the controls; the list follows it across the row.
  info: Snippet<[controls: Snippet]>;
};
