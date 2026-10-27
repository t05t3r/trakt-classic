import type { Snippet } from 'svelte';

export type IconToggleProps = {
  label: string;
  pressed: boolean;
  onToggle: () => void;
  // A detail heading's glyph is larger than a list toolbar's.
  size?: 'toolbar' | 'heading';
  // The glyph; the caller swaps it with the state.
  children: Snippet;
};
