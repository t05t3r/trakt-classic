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
  children: Snippet<[string]>;
};
