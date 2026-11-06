import type { RatingsParams } from '$lib/features/ratings/stores/useRatingsParams.ts';
import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';
import type { Dividers } from '$lib/stores/useDividers.ts';

export type RatingsToolbarProps = {
  // The screen's own instance, so the toolbar adds no second one.
  params: RatingsParams;
  // The screen's own instance too, which its grid reads.
  dividers: Dividers;
  // Blank while it is undefined.
  itemCount?: number;
  controls: ToolbarControls;
};
