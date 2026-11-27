import type { Icon } from '@tabler/icons-svelte';
import type { Snippet } from 'svelte';

export type OutlineBadgeProps = {
  icon?: Icon;
  // `danger` outlines a hidden season, `watch` a complete one, `neutral` a plain fact.
  tone: 'danger' | 'watch' | 'neutral';
  children: Snippet;
};
