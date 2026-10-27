import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

export type DropdownButtonProps =
  & {
    // The accessible name: it carries the context and contains the visible text.
    label: string;
    selected?: boolean;
    // `default` is the boxed menu button, `icon` a bare glyph and caret.
    variant?: 'default' | 'icon';
    // `heading` takes the family of the heading the button sits in.
    font?: 'body' | 'heading';
    children: Snippet;
  }
  & Omit<HTMLButtonAttributes, 'class' | 'aria-label' | 'type' | 'children'>;
