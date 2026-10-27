import type { Snippet } from 'svelte';
import type { StatsRow } from '$lib/sections/summary/StatsRow.ts';

export type SummaryOverviewProps = {
  rows?: ReadonlyArray<StatsRow>;
  tagline?: string;
  overview: string;
  trailer?: HttpsUrl | Nil;
  actions?: Snippet;
};
