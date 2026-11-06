import type { TriggerSnippet } from '$lib/components/menus/TriggerSnippet.ts';
import type { Snippet } from 'svelte';

type PopoverBaseProps = {
  label: string;
  children: Snippet;
  side?: 'top' | 'bottom';
  // `'flush'` gives the content the whole box, at its full width.
  variant?: 'default' | 'flush';
  open?: boolean;
};

export type PopoverProps =
  & PopoverBaseProps
  & (
    | { trigger: TriggerSnippet; anchor?: never }
    // Opened by its parent, it sits on the anchor and gives it back the focus.
    | { anchor: HTMLElement | Nil; trigger?: never }
  );
