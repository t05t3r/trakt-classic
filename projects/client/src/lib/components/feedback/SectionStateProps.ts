import type { SectionHeaderProps } from '$lib/components/headers/SectionHeaderProps.ts';
import type { Snippet } from 'svelte';
import type { SectionStatus } from './SectionStatus.ts';

type SectionStateContent<T> =
  | { status: SectionStatus<T>; emptyText: string }
  | {
    status: Exclude<SectionStatus<T>, { kind: 'empty' }>;
    emptyText?: never;
  };

export type SectionStateProps<T> =
  & {
    header: Omit<SectionHeaderProps, 'loading' | 'titleId'>;
    // Rendered before the header, in its row.
    lead?: Snippet;
    // Names the section in place of its title, for a title that does not name the whole section.
    label?: string;
    children?: Snippet<[T]>;
  }
  & SectionStateContent<T>;
