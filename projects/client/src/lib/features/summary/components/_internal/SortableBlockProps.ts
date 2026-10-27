import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { PosterGridProps } from '$lib/components/media/PosterGridProps.ts';
import type {
  SortParam,
  SortParamSpec,
} from '$lib/features/view-params/stores/useSortParam.ts';
import type { Snippet } from 'svelte';

export type SortableBlockProps<T, K extends string> = {
  title: Snippet;
  status: SectionStatus<ReadonlyArray<T>>;
  emptyText: string;
  sort: SortParamSpec<K> & {
    labels: Readonly<Record<K, () => string>>;
    apply: (
      params: { items: ReadonlyArray<T>; sort: SortParam<K> },
    ) => ReadonlyArray<T>;
  };
  // Drives the watched filter's fade and hide.
  isWatched: (item: T) => boolean;
  grid: Pick<
    PosterGridProps<T>,
    'key' | 'columns' | 'phoneDivider' | 'phoneGaps'
  >;
  item: Snippet<[T]>;
};
