import type EpisodesWatchedBar from '$lib/components/progress/EpisodesWatchedBar.svelte';
import type { ComponentProps, Snippet } from 'svelte';

export type PercentageBarProps = ComponentProps<typeof EpisodesWatchedBar> & {
  // Laid over the track, as wide as the bar.
  overlay?: Snippet;
};
