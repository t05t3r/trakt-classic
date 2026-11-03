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
    // Ignores clicks, dimmed, with the reason as its description: the action is not allowed yet.
    blockedReason?: string;
  }
  & Omit<HTMLButtonAttributes, 'class' | 'aria-label' | 'type' | 'title'>;
