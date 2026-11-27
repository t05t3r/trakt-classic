import type { Snippet } from 'svelte';
import type { ToolbarControls } from './ListItemsSectionProps.ts';

export type ToolbarFilterBandProps<T> = {
  // The filter the band names and clears; none, no band.
  filter: T | null;
  // Names the toolbar's gear and panel, which take a leaving band's focus.
  controls: Pick<ToolbarControls, 'gearId' | 'panelId'>;
  toolbar: Snippet;
  band: Snippet<[T]>;
};
