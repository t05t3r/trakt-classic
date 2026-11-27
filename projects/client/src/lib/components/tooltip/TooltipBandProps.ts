import type { Snippet } from 'svelte';

export type TooltipBandProps = {
  // `start` raises the tooltip's top band, `end` sinks its bottom one.
  edge: 'start' | 'end';
  // `none` keeps the tooltip's own surface under the rule.
  fill?: 'edge' | 'none';
  children: Snippet;
};
