import type { Snippet } from 'svelte';

export type ListMenuRowProps = {
  // Not known yet while its store reads, so a click is ignored.
  isOn: boolean | undefined;
  add: () => Promise<boolean>;
  remove: () => Promise<boolean>;
  // A dropdown menu item, or a checkbox row in the phone modal.
  variant: 'menu' | 'modal';
  children: Snippet;
};
