import type { Icon } from '@tabler/icons-svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

export type QuickIconProps =
  & {
    action: 'watch' | 'list' | 'favorite';
    icon: Icon;
    label: string;
    isSelected: boolean;
    isPending?: boolean;
    // Ignores clicks, as while the state is not known.
    isInert?: boolean;
  }
  & Omit<HTMLButtonAttributes, 'class' | 'aria-label' | 'type'>;
