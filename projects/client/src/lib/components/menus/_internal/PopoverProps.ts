import type { Snippet } from 'svelte';

export type PopoverProps = {
  label: string;
  // Spread `props` on the trigger's own button.
  trigger: Snippet<[{ props: Record<string, unknown> }]>;
  children: Snippet;
  side?: 'top' | 'bottom';
  open?: boolean;
};
