import type { Snippet } from 'svelte';

export type DashboardSectionProps = {
  name:
    | 'hero'
    | 'up-next'
    | 'schedule'
    | 'watchlist'
    | 'last-30-days'
    | 'recently-watched'
    | 'recommendations';
  children: Snippet;
  bleed?: Snippet;
};
