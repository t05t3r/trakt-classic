import type Menu from '$lib/components/menus/Menu.svelte';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import type { ComponentProps } from 'svelte';

export type ListMenuProps = {
  // Read once, when the menu is made: a new Target needs a new menu.
  type: TargetMediaType;
  id: number;
  trigger: ComponentProps<typeof Menu>['trigger'];
};
