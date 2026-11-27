import type { Snippet } from 'svelte';
import type { SectionStatus } from './SectionStatus.ts';

export type StatusFrameProps<T> = {
  status: SectionStatus<T>;
  // Rendered when the status holds nothing.
  empty: Snippet;
  children: Snippet<[T]>;
  // The id of what describes the retry.
  describedBy?: string;
};
