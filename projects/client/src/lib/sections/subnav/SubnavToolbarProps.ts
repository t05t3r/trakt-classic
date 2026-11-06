import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';
import type { Snippet } from 'svelte';

export type SubnavToolbarProps = {
  controls: ToolbarControls;
  // Under 'none' the options stay inline on wider screens and hide on phones.
  panel: 'options' | 'none';
  // What a phone's row keeps: the stats, or the controls in place of them.
  phone: 'stats' | 'controls';
  start?: Snippet;
  stats: Snippet;
  options?: Snippet;
  end?: Snippet;
};
