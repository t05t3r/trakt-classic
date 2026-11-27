import type { Pathname } from '$app/types';
import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type {
  PagedCard,
  PagedReading,
} from '$lib/features/paging/stores/usePagedItems.ts';
import type { Snippet } from 'svelte';

export type ToolbarControls = {
  open: boolean;
  panelId: string;
  // Found by id, so the focus can return to it after the panel closes.
  gearId: string;
  // Opens the panel, leading the focus in, or shuts it.
  toggle: () => void;
  // Shuts the panel and hands the focus back to the gear.
  close: () => void;
  // Only without a title bar, whose spinner then moves into the toolbar.
  loading?: boolean;
};

// A page's reading, unmapped: `total` is undefined until a read gives a count.
export type ListItemsSectionReading<T> = Readonly<{
  status: SectionStatus<ReadonlyArray<T>>;
  pages: PagedReading<unknown, PagedCard>['pages'];
}>;

export type ListItemsSectionProps<T> = {
  // Undefined until the page's read gives its first value.
  reading: ListItemsSectionReading<T> | undefined;
  // Without one, no title bar or description shows.
  heading?: { title: string; href: Pathname; description: string };
  emptyText: string;
  grid: Snippet<[ReadonlyArray<T>]>;
  toolbar: Snippet<[ToolbarControls]>;
  // The grid's cells, which the focus keeper hands on between, in one grid or several; `PosterGrid` cells by default.
  cellSelector?: string;
};
