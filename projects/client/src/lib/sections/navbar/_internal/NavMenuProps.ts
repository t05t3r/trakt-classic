import type { NavItem } from '$lib/features/navigation/topNavItems.ts';
import type { Snippet } from 'svelte';

export type NavMenuRow = {
  role: 'menuitem';
  class: string;
  tabindex: -1;
};

export type NavMenuProps<K extends string> = {
  label: string;
  trigger: Snippet<[boolean]>;
  items: ReadonlyArray<NavItem<K>>;
  action?: Snippet<[NavMenuRow]>;
};
