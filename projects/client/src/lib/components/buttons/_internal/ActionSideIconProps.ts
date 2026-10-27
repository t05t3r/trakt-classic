import type { Icon } from '@tabler/icons-svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

export type ActionSideIconProps =
  & {
    icon: Icon;
    label: string;
  }
  & Omit<HTMLButtonAttributes, 'class' | 'title' | 'aria-label' | 'type'>;
