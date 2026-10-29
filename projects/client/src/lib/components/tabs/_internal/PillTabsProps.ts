import type { Snippet } from 'svelte';

type PillTab = {
  value: string;
  text: string;
  // Formatted by the caller: a number, or a label such as "30 Days".
  count?: string;
};

export type PillTabsProps = {
  label: string;
  tabs: ReadonlyArray<PillTab>;
  value: string;
  onValueChange: (value: string) => void;
  // Takes the shown tab's value and the id of its tab, which can describe what the pane holds.
  children: Snippet<[string, string]>;
};
