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
  // Shuts the panel and hands the focus back to the gear.
  close: () => void;
  // Only without a title bar, whose gear and spinner then move into the toolbar.
  untitled?: { gearId: string; toggle: () => void; loading: boolean };
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
  // The focus keeper finds the cards as `PosterGrid` cells, in one grid or several.
  grid: Snippet<[ReadonlyArray<T>]>;
  toolbar: Snippet<[ToolbarControls]>;
};
