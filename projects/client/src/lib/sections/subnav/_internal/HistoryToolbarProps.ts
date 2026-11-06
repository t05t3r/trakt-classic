import type { HistoryParams } from '$lib/features/history/stores/useHistoryParams.ts';
import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';
import type { Dividers } from '$lib/stores/useDividers.ts';

export type HistoryToolbarProps = {
  // The screen's own instance, so the toolbar adds no second one.
  params: HistoryParams;
  // The screen's own instance too, which its grid reads.
  dividers: Dividers;
  // Blank while it is undefined.
  itemCount?: number;
  // Left out while it is undefined: hidden, loading or failed.
  plays?: number;
  controls: ToolbarControls;
};
