import type { ListDisplayType } from '$lib/features/lists/LIST_TYPES.ts';
import type { ListParams } from '$lib/features/lists/stores/useListParams.ts';
import type { WatchedPercentage } from '$lib/features/lists/stores/useWatchedPercentage.ts';

export type ListStatsToolbarProps<T extends ListDisplayType> = {
  // The screen's own instance, so the toolbar adds no second one.
  params: ListParams<T>;
  // Each count is blank while it is undefined.
  watched?: WatchedPercentage;
  itemCount?: number;
  // The total runtime of the loaded items.
  minutes?: number;
  // Past one page, the loaded items are not the List, so no runtime shows.
  pageCount?: number;
  // On phones, whether the options panel shows.
  isPanelOpen: boolean;
  // The options panel's id, for the control that opens it.
  panelId: string;
  // Called after a choice in the options that changes a value.
  onChoose: () => void;
};
