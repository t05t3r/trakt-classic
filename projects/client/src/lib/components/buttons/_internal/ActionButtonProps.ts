import type { Icon } from '@tabler/icons-svelte';
import type { Snippet } from 'svelte';

export type ActionButtonProps = {
  color: 'watch' | 'list' | 'favorite';
  icon: Icon;
  label: string;
  underInfo?: string;
  // `undefined` while the state loads: shown unselected, and clicks are ignored.
  selected?: boolean;
  isUpdating?: boolean;
  // Ignores clicks but keeps showing `selected`, as while a value it needs loads.
  isInert?: boolean;
  onclick: () => void;
  // `ActionSideIcon`s, laid out side by side.
  side?: Snippet;
};
