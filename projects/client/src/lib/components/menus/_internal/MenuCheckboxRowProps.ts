import type { Snippet } from 'svelte';
import type { MenuCheckState } from './MenuCheckState.ts';

export type MenuCheckboxRowProps = {
  // `'unknown'` while the state loads: a spinner, read as disabled.
  checked: MenuCheckState;
  onToggle: () => void;
  children: Snippet;
};
