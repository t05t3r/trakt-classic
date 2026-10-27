import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { Snippet } from 'svelte';

export type SummaryHeroProps = {
  backdrop: ImageUrl | Nil;
  title: string;
  sxe?: string;
  year: number | Nil;
  // Shown only once hydrated, since a date-derived year reads the viewer's time zone.
  yearZoned?: boolean;
  certification?: string | Nil;
  breadcrumb?: Snippet;
  // Above the breadcrumb, outside any heading, so the heading levels stay in order.
  premiere?: Snippet;
  poster?: Snippet;
  ratings?: Snippet;
  neighbours?: Snippet;
};
