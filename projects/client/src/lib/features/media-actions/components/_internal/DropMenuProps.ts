import type Menu from '$lib/components/menus/Menu.svelte';
import type { ComponentProps } from 'svelte';

type ControlTrigger = ComponentProps<typeof Menu>['trigger'];

export type DropMenuProps = {
  // Read once, when the menu is made: a new show needs a new menu.
  show: { id: number; title: string };
  // Each defaults to the menu's own icon button.
  trigger?: ControlTrigger;
  restoreTrigger?: ControlTrigger;
};
