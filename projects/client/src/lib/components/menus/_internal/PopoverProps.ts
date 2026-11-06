import type { TriggerSnippet } from '$lib/components/menus/TriggerSnippet.ts';
import type { Snippet } from 'svelte';

export type PopoverProps = {
  label: string;
  trigger: TriggerSnippet;
  children: Snippet;
  side?: 'top' | 'bottom';
  // `'flush'` gives the content the whole box, at its full width.
  variant?: 'default' | 'flush';
  open?: boolean;
};
