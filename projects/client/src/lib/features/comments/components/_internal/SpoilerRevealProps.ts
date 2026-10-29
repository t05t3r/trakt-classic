import type { Snippet } from 'svelte';

export type SpoilerRevealProps = {
  children: Snippet;
  display: 'block' | 'inline';
  // Reveals with no focus move unless its button held the focus, and latches: turning false again never conceals.
  revealed?: boolean;
};
