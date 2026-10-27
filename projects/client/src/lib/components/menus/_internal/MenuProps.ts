import type { Snippet } from 'svelte';

export type MenuProps = {
  label: string;
  // Spread `props` on the trigger's own button.
  trigger: Snippet<[{ props: Record<string, unknown> }]>;
  children: Snippet;
  align?: 'start' | 'end';
  // Keeps the menu shut while its trigger stays focusable and announced.
  isInert?: boolean;
};
