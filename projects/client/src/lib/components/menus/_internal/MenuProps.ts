import type { TriggerSnippet } from '$lib/components/menus/TriggerSnippet.ts';
import type { Snippet } from 'svelte';

export type MenuProps = {
  label: string;
  trigger: TriggerSnippet;
  children: Snippet;
  align?: 'start' | 'end';
  // Keeps a closed menu shut while its trigger stays focusable and announced.
  isInert?: boolean;
  // Caps the menu at a fixed height, below the available one, and scrolls.
  isLimited?: boolean;
};
