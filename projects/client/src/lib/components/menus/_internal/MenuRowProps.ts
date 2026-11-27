import type { Snippet } from 'svelte';
import type { MenuCheckState } from './MenuCheckState.ts';

export type MenuRowProps = {
  checked?: MenuCheckState;
  // Drawn in a column of its own before the label, so every label starts alike.
  glyph?: Snippet;
  // `dropdown` is a dropdown menu's row, `nav` a header menu's taller one with no check.
  variant?: 'dropdown' | 'nav';
  children: Snippet;
};
