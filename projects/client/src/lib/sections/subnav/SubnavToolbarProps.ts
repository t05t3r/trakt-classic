import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';
import type { Snippet } from 'svelte';

export type SubnavToolbarProps = {
  controls: ToolbarControls;
  start: Snippet;
  stats: Snippet;
  // With the start, it fills the panel that the gear opens on phones.
  options?: Snippet;
  // A control in the panel is off its default, which the gear marks.
  changed?: boolean;
  end?: Snippet;
};
