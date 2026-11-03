import type { Pathname } from '$app/types';
import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { PosterGridProps } from '$lib/components/media/PosterGridProps.ts';
import type { PaginationProps } from '$lib/components/pagination/PaginationProps.ts';
import type { Snippet } from 'svelte';

export type ListItemsSectionProps<T> =
  & Pick<PosterGridProps<T>, 'key' | 'item'>
  & {
    status: SectionStatus<ReadonlyArray<T>>;
    pages: Pick<PaginationProps, 'current' | 'total'>;
    title: string;
    href: Pathname;
    description: string;
    emptyText: string;
    // `close` shuts the panel and hands the focus back to the gear.
    toolbar: Snippet<[{ open: boolean; panelId: string; close: () => void }]>;
  };
