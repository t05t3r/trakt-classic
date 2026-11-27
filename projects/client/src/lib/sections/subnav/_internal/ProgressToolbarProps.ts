import type { ProgressStats } from '$lib/features/progress/sumProgressStats.ts';
import type { ProgressParams } from '$lib/features/progress/stores/useProgressParams.ts';
import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';

export type ProgressToolbarProps = {
  // The screen's own instance, so the toolbar adds no second one.
  params: ProgressParams;
  // Every stat is blank while it is undefined.
  stats?: ProgressStats;
  // Its `close` runs after any choice in the options.
  controls: ToolbarControls;
};
