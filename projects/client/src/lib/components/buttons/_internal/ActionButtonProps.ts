import type { Icon } from '@tabler/icons-svelte';
import type { Snippet } from 'svelte';

export type ActionButtonProps = {
  color: 'watch' | 'list' | 'favorite';
  icon: Icon;
  label: string;
  underInfo?: string;
  // Drawn as a bar along the bottom edge; the label says it, so a screen reader hears it once.
  percent?: number;
  // `undefined` while the state loads: shown unselected, and clicks are ignored.
  selected?: boolean;
  isUpdating?: boolean;
  // Ignores clicks but keeps showing `selected`, as while a value it needs loads.
  isInert?: boolean;
  // Ignores clicks, dimmed, with the reason as its description: the action is not allowed yet.
  blockedReason?: string;
  onclick: () => void;
  // `ActionSideIcon`s, laid out side by side.
  side?: Snippet;
};
